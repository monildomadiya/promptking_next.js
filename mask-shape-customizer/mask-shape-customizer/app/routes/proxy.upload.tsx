import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

const MAX_BYTES = 15 * 1024 * 1024;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticate.public.appProxy(request);
  } catch {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return json({
    ok: true,
    message: "POST a multipart form with field 'file' (image) to upload.",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let admin: Awaited<
    ReturnType<typeof authenticate.public.appProxy>
  >["admin"];

  try {
    const ctx = await authenticate.public.appProxy(request);
    admin = ctx.admin;
  } catch {
    return json({ error: "Invalid app proxy request" }, { status: 401 });
  }

  if (!admin) {
    return json(
      {
        error:
          "No admin session for this shop. Install the app and open it once in Shopify admin.",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return json({ error: "Expected multipart field 'file'" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return json({ error: "Empty file" }, { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    return json({ error: "File too large (max 15MB)" }, { status: 400 });
  }

  const mimeType = file.type || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    return json({ error: "Only image uploads are allowed" }, { status: 400 });
  }

  const safeName =
    file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "customer-upload.jpg";

  const stagedRes = await admin.graphql(
    `#graphql
      mutation StagedUpload($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        input: [
          {
            filename: safeName,
            mimeType,
            httpMethod: "POST",
            resource: "IMAGE",
            fileSize: String(buffer.length),
          },
        ],
      },
    },
  );

  const stagedJson = await stagedRes.json();
  const stagedData = stagedJson.data?.stagedUploadsCreate;
  const errMsg = stagedData?.userErrors?.[0]?.message;
  if (errMsg) {
    return json({ error: errMsg }, { status: 502 });
  }

  const target = stagedData?.stagedTargets?.[0];
  if (!target?.url || !target.resourceUrl) {
    return json({ error: "Staging upload failed" }, { status: 502 });
  }

  const uploadForm = new FormData();
  for (const param of target.parameters ?? []) {
    uploadForm.append(param.name, param.value);
  }
  uploadForm.append(
    "file",
    new Blob([buffer], { type: mimeType }),
    safeName,
  );

  const putRes = await fetch(target.url, {
    method: "POST",
    body: uploadForm,
  });

  if (!putRes.ok) {
    return json(
      { error: `Storage upload failed (${putRes.status})` },
      { status: 502 },
    );
  }

  const createRes = await admin.graphql(
    `#graphql
      mutation CreateMaskFile($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            ... on MediaImage {
              id
              image {
                url
              }
            }
            ... on GenericFile {
              id
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        files: [
          {
            originalSource: target.resourceUrl,
            contentType: "IMAGE",
            alt: "Customer artwork upload",
          },
        ],
      },
    },
  );

  const createJson = await createRes.json();
  const fileCreate = createJson.data?.fileCreate;
  const createErr = fileCreate?.userErrors?.[0]?.message;
  if (createErr) {
    return json({ error: createErr }, { status: 502 });
  }

  const created = fileCreate?.files?.[0] as
    | { image?: { url?: string } }
    | { url?: string }
    | undefined;

  const url =
    created && "image" in created && created.image?.url
      ? created.image.url
      : created && "url" in created
        ? created.url
        : null;

  if (!url) {
    return json({ error: "File created but no public URL returned" }, { status: 502 });
  }

  return json({ ok: true, url });
};
