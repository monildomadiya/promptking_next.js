import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <Page>
      <TitleBar title="Mask shape image upload" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="h2" variant="headingLg">
                    Mask shape customizer
                  </Text>
                  <Badge tone="success">Theme + app proxy</Badge>
                </InlineStack>
                <Text as="p" variant="bodyMd">
                  This app adds a storefront block similar in spirit to{" "}
                  <Link
                    url="https://www.cloudlift.app/pages/template/mask-shapes-image-upload"
                    target="_blank"
                    removeUnderline
                  >
                    Cloudlift’s mask-shapes image upload pattern
                  </Link>
                  : customers upload an image, pick a mask shape, see a live
                  preview, and their file is stored in Shopify Files. The image
                  URL and shape are attached as line item properties on add to
                  cart.
                </Text>
                <Box
                  padding="400"
                  background="bg-surface-secondary"
                  borderRadius="200"
                >
                  <Text as="h3" variant="headingMd">
                    Setup
                  </Text>
                  <List type="number">
                    <List.Item>
                      Run{" "}
                      <Box as="span" fontWeight="semibold">
                        shopify app dev
                      </Box>{" "}
                      from this project so the app proxy URL stays in sync with
                      your tunnel.
                    </List.Item>
                    <List.Item>
                      In{" "}
                      <Link
                        url="https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor"
                        target="_blank"
                        removeUnderline
                      >
                        Online Store → Themes → Customize
                      </Link>
                      , open a{" "}
                      <Box as="span" fontWeight="semibold">
                        product
                      </Box>{" "}
                      template and add the app block{" "}
                      <Box as="span" fontWeight="semibold">
                        Mask shape image upload
                      </Box>{" "}
                      (Apps section). Place it on the product page near your add
                      to cart form.
                    </List.Item>
                    <List.Item>
                      After installing, open this app once in admin so an offline
                      session exists; the storefront uploader needs it to create
                      files via the Admin API.
                    </List.Item>
                    <List.Item>
                      Optional: turn on{" "}
                      <Box as="span" fontWeight="semibold">
                        Require image upload before add to cart
                      </Box>{" "}
                      in the block settings.
                    </List.Item>
                  </List>
                </Box>
                <Text as="p" variant="bodyMd" tone="subdued">
                  App proxy path:{" "}
                  <Box as="span" fontWeight="semibold">
                    /apps/mask-shape-upload/upload
                  </Box>{" "}
                  → Remix route{" "}
                  <Box as="span" fontWeight="semibold">
                    /proxy/upload
                  </Box>
                  . Scopes: write_products, write_files.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
