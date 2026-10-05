import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deleteCloudinaryAssets } from "./destroy";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("CLOUDINARY_API_KEY", "key123");
  vi.stubEnv("CLOUDINARY_API_SECRET", "secret456");
  fetchMock.mockResolvedValue({ ok: true, status: 200 });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

describe("deleteCloudinaryAssets", () => {
  it("no hace nada si no hay assets", async () => {
    await deleteCloudinaryAssets({});
    await deleteCloudinaryAssets({ image: [], raw: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no hace nada si faltan las credenciales", async () => {
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    await deleteCloudinaryAssets({ image: ["a"] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("borra imágenes con DELETE al Admin API, con auth básica e invalidate", async () => {
    await deleteCloudinaryAssets({ image: ["products/a", "products/b"] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://api.cloudinary.com/v1_1/test-cloud/resources/image/upload",
    );
    expect(parsed.searchParams.getAll("public_ids[]")).toEqual([
      "products/a",
      "products/b",
    ]);
    expect(parsed.searchParams.get("invalidate")).toBe("true");
    expect(init.method).toBe("DELETE");
    expect(init.headers.Authorization).toBe(
      `Basic ${Buffer.from("key123:secret456").toString("base64")}`,
    );
  });

  it("usa resource_type raw para los modelos 3D, en una llamada aparte", async () => {
    await deleteCloudinaryAssets({
      image: ["products/a"],
      raw: ["products/model.glb"],
    });

    const urls = fetchMock.mock.calls.map(([url]) => new URL(url).pathname);
    expect(urls).toEqual([
      "/v1_1/test-cloud/resources/image/upload",
      "/v1_1/test-cloud/resources/raw/upload",
    ]);
  });

  it("parte en lotes de 100 (límite del Admin API)", async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `products/img-${i}`);
    await deleteCloudinaryAssets({ image: ids });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const sizes = fetchMock.mock.calls.map(
      ([url]) => new URL(url).searchParams.getAll("public_ids[]").length,
    );
    expect(sizes).toEqual([100, 100, 50]);
  });

  it("lanza si Cloudinary responde error, sin filtrar el secret", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    await expect(
      deleteCloudinaryAssets({ image: ["products/a"] }),
    ).rejects.toThrow(/401/);
    await expect(
      deleteCloudinaryAssets({ image: ["products/a"] }),
    ).rejects.not.toThrow(/secret456/);
  });
});
