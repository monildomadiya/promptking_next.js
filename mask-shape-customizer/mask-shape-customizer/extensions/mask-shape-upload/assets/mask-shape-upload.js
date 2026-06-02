/**
 * Mask-shape customizer: live preview (CSS clip-path / SVG clip) + upload via app proxy before add to cart.
 */
(function () {
  const SHAPES = {
    circle: "circle(46% at 50% 50%)",
    square: "inset(8%)",
    rounded: "inset(8% round 28%)",
    hexagon:
      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
    star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  };

  function applyClip(inner, shape, heartId) {
    if (shape === "heart" && heartId) {
      inner.style.clipPath = `url(#${heartId})`;
      inner.style.webkitClipPath = `url(#${heartId})`;
      return;
    }
    const path = SHAPES[shape] || SHAPES.circle;
    inner.style.clipPath = path;
    inner.style.webkitClipPath = path;
  }

  function findProductForm() {
    const forms = document.querySelectorAll('form[action*="/cart/add"]');
    return forms.length ? forms[0] : null;
  }

  function getVariantId(form) {
    const input = form?.querySelector(
      'input[name="id"]:not([disabled]), select[name="id"]:not([disabled])',
    );
    if (!input) return null;
    if (input.tagName === "SELECT") return input.value;
    return input.value;
  }

  function initRoot(root) {
    const uploadPath = root.dataset.uploadPath;
    const heartId = root.dataset.clipHeartId || "";
    const fileInput = root.querySelector('[data-mask-file]');
    const inner = root.querySelector("[data-mask-preview-inner]");
    const shapeInputs = root.querySelectorAll("[data-mask-shape-radio]");
    const statusEl = root.querySelector("[data-mask-status]");
    const requireUpload = root.dataset.requireUpload === "true";

    let objectUrl = null;
    let busy = false;
    let applyingCart = false;

    function setStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.style.color = isError ? "#b42318" : "";
    }

    function currentShape() {
      const checked = root.querySelector("[data-mask-shape-radio]:checked");
      return checked ? checked.value : "circle";
    }

    function updatePreview() {
      if (!inner) return;
      applyClip(inner, currentShape(), heartId);
    }

    shapeInputs.forEach((el) =>
      el.addEventListener("change", () => {
        updatePreview();
        setStatus("");
      }),
    );

    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      if (!file || !inner) return;
      if (!file.type.startsWith("image/")) {
        setStatus("Please choose an image file.", true);
        fileInput.value = "";
        return;
      }
      objectUrl = URL.createObjectURL(file);
      inner.style.backgroundImage = `url(${objectUrl})`;
      inner.style.backgroundSize = "cover";
      inner.style.backgroundPosition = "center";
      inner.style.backgroundRepeat = "no-repeat";
      updatePreview();
      setStatus("");
    });

    updatePreview();

    document.addEventListener(
      "submit",
      async (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (!form.action?.includes("/cart/add")) return;
        if (applyingCart) return;
        if (!fileInput?.files?.length) {
          if (requireUpload) {
            e.preventDefault();
            setStatus("Upload an image to continue.", true);
          }
          return;
        }

        e.preventDefault();
        if (busy) return;
        busy = true;
        setStatus("Uploading your image…");

        const fd = new FormData();
        fd.append("file", fileInput.files[0]);
        fd.append("shape", currentShape());

        try {
          const res = await fetch(uploadPath, {
            method: "POST",
            body: fd,
            credentials: "same-origin",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || `Upload failed (${res.status})`);
          }
          const url = data.url;
          if (!url) throw new Error("No file URL returned");

          ["properties[Mask shape]", "properties[_mask_shape]"].forEach(
            (name) => {
              form.querySelector(`input[name="${name}"]`)?.remove();
            },
          );
          const hiddenShape = document.createElement("input");
          hiddenShape.type = "hidden";
          hiddenShape.name = "properties[Mask shape]";
          hiddenShape.value = currentShape();
          form.appendChild(hiddenShape);

          ["properties[Custom artwork]", "properties[_custom_artwork]"].forEach(
            (name) => {
              form.querySelector(`input[name="${name}"]`)?.remove();
            },
          );
          const hiddenUrl = document.createElement("input");
          hiddenUrl.type = "hidden";
          hiddenUrl.name = "properties[Custom artwork]";
          hiddenUrl.value = url;
          form.appendChild(hiddenUrl);

          applyingCart = true;
          setStatus("");
          form.submit();
        } catch (err) {
          setStatus(err.message || "Upload failed", true);
        } finally {
          busy = false;
          applyingCart = false;
        }
      },
      true,
    );
  }

  document.querySelectorAll("[data-mask-shape-root]").forEach(initRoot);
})();
