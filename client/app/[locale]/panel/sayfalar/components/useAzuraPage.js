"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AZURA_PAGES_API,
  assertPageResult,
  pageRequest,
  saveAzuraPage,
} from "@/lib/admin/azura-pages-client.mjs";

const AZURA_MEDIA_LIBRARY_API =
  "/api/admin/azura/media-library";

const DYNAMIC_PAGE_MEDIA_SCOPE =
  "dynamic-pages";

const MEDIA_LIBRARY_PAGE_SIZE = 100;

export default function useAzuraPage({
  enabled,
  pageId,
  acceptSavedDraft,
}) {
  const current = useRef(null);
  const busyRef = useRef(false);

  const [blocked, setBlocked] =
    useState(false);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [images, setImages] = useState([]);
  const [mediaLoading, setMediaLoading] =
    useState(false);
  const [mediaError, setMediaError] =
    useState("");
  const [revision, setRevision] =
    useState("");

  const adopt = useCallback(
    (result) => {
      assertPageResult(result);

      current.current = result;

      setRevision(result.revision);
      setOrigin(result.mediaOrigin);

      acceptSavedDraft(result.page);

      setBlocked(false);
    },
    [acceptSavedDraft]
  );

  /*
   * Ortak Azura medya kütüphanesindeki
   * tüm görselleri yükler.
   *
   * Backend en fazla 100 kayıt verdiği
   * için nextOffset üzerinden bütün
   * sayfaları sırayla alıyoruz.
   */
  const loadImages = useCallback(
    async (signal) => {
      if (!enabled) return;

      setMediaLoading(true);
      setMediaError("");

      try {
        const collected = [];

        let offset = 0;
        let nextOffset = 0;
        let libraryOrigin = "";

        while (nextOffset !== null) {
          const params =
            new URLSearchParams({
              limit: String(
                MEDIA_LIBRARY_PAGE_SIZE
              ),
              offset: String(offset),
            });

          const payload =
            await pageRequest(
              `${AZURA_MEDIA_LIBRARY_API}?${params.toString()}`,
              { signal }
            );

          if (
            !Array.isArray(payload.images)
          ) {
            throw new Error(
              "Medya kütüphanesi geçersiz."
            );
          }

          if (
            !libraryOrigin &&
            payload.mediaOrigin
          ) {
            libraryOrigin =
              payload.mediaOrigin;
          }

          collected.push(
            ...payload.images
          );

          nextOffset =
            payload.nextOffset ?? null;

          if (nextOffset !== null) {
            offset = nextOffset;
          }
        }

        if (signal?.aborted) {
          return;
        }

        /*
         * PageImagePicker external
         * asset'lerde previewUrl bekliyor.
         */
        const normalizedImages =
          collected.map((image) => ({
            ...image,

            previewUrl: libraryOrigin
              ? `${libraryOrigin}${image.image}`
              : "",
          }));

        setImages(normalizedImages);

        if (libraryOrigin) {
          setOrigin(libraryOrigin);
        }
      } catch (error) {
        if (
          error.name !== "AbortError"
        ) {
          setMediaError(
            error.message ||
              "Medya kütüphanesi yüklenemedi."
          );
        }
      } finally {
        if (!signal?.aborted) {
          setMediaLoading(false);
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    const controller =
      new AbortController();

    loadImages(controller.signal);

    /*
     * Yeni sayfada henüz page sonucu
     * olmadığı için güvenilir Azura
     * origin'ini ayrıca alıyoruz.
     */
    if (!pageId) {
      pageRequest(AZURA_PAGES_API, {
        signal: controller.signal,
      })
        .then((result) => {
          if (
            !controller.signal.aborted
          ) {
            setOrigin(
              result.mediaOrigin
            );
          }
        })
        .catch((error) => {
          if (
            error.name !==
            "AbortError"
          ) {
            setMediaError(
              error.message
            );
          }
        });
    }

    return () =>
      controller.abort();
  }, [
    enabled,
    pageId,
    loadImages,
  ]);

  const save = async (
    draft,
    publicationStatus
  ) => {
    if (
      busyRef.current ||
      blocked
    ) {
      throw new Error(
        "Önce devam eden işlemi tamamlayın veya sunucudaki kaydı yükleyin."
      );
    }

    const id =
      current.current?.page.id ||
      pageId;

    if (
      id &&
      !current.current?.revision
    ) {
      throw new Error(
        "Sayfanın güncel sürümü yüklenmedi."
      );
    }

    busyRef.current = true;
    setBusy(true);

    try {
      return await saveAzuraPage({
        id,
        revision:
          current.current?.revision,
        draft,
        publicationStatus,
        onSaved: adopt,
      });
    } catch (error) {
      if (
        error.status === 409 ||
        error.status >= 500 ||
        error.status === 404 ||
        error.status === 428
      ) {
        setBlocked(true);
      }

      throw error;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const reload = async () => {
    if (busyRef.current) return;

    const id =
      current.current?.page.id ||
      pageId;

    if (!id) {
      throw new Error(
        "Oluşturma sonucu doğrulanamadı. Sayfalar listesine dönüp kaydın oluşup oluşmadığını kontrol edin."
      );
    }

    if (
      !window.confirm(
        "Formdaki kaydedilmemiş değişiklikler bırakılıp sunucudaki kayıt yüklensin mi?"
      )
    ) {
      return;
    }

    busyRef.current = true;
    setBusy(true);

    try {
      adopt(
        await pageRequest(
          `${AZURA_PAGES_API}/${id}`
        )
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const restore = async (
    versionId
  ) => {
    if (
      busyRef.current ||
      blocked ||
      !current.current?.revision
    ) {
      throw new Error(
        "Önce sunucudaki güncel kaydı yükleyin."
      );
    }

    if (
      !window.confirm(
        "Seçilen sürüm taslağa getirilecek. Formdaki kaydedilmemiş değişiklikler bırakılacak; canlı yayın değişmeyecek. Devam edilsin mi?"
      )
    ) {
      return false;
    }

    busyRef.current = true;
    setBusy(true);

    try {
      adopt(
        await pageRequest(
          `${AZURA_PAGES_API}/${current.current.page.id}/history/${versionId}/restore`,
          {
            method: "POST",
            headers: {
              "If-Match": `"${current.current.revision}"`,
            },
          }
        )
      );

      return true;
    } catch (error) {
      if (
        error.status === 409 ||
        error.status >= 500
      ) {
        setBlocked(true);
      }

      throw error;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  /*
   * Bilgisayardan yeni görsel yükleme.
   *
   * Mevcut çalışan endpoint'i
   * değiştirmiyoruz.
   */
  const upload = async (file) => {
    if (
      busyRef.current ||
      blocked
    ) {
      throw new Error(
        "Devam eden işlem tamamlanmadan yükleme yapılamaz."
      );
    }

    busyRef.current = true;
    setBusy(true);

    try {
      const body = new FormData();

      body.append("file", file);

      const result =
        await pageRequest(
          `${AZURA_PAGES_API}/images`,
          {
            method: "POST",
            body,
          }
        );

      if (
        !result.image?.startsWith(
          "/uploads/dynamic-pages/"
        )
      ) {
        throw new Error(
          "Yükleme yanıtı geçersiz."
        );
      }

      /*
       * Yeni yüklenen görseli mevcut
       * picker listesine de ekle.
       */
      const normalizedResult = {
        ...result,

        name:
          result.image
            .split("/")
            .pop() ||
          "Yeni görsel",

        scope:
          DYNAMIC_PAGE_MEDIA_SCOPE,

        folder:
          "dynamic-pages",

        previewUrl:
          result.previewUrl ||
          (origin
            ? `${origin}${result.image}`
            : ""),
      };

      setImages((previous) => [
        normalizedResult,

        ...previous.filter(
          (image) =>
            image.image !==
            result.image
        ),
      ]);

      if (result.previewUrl) {
        setOrigin(
          new URL(
            result.previewUrl
          ).origin
        );
      }

      return result.image;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  /*
   * Ortak medya kütüphanesindeki
   * mevcut bir görseli dinamik sayfa
   * scope'una güvenli şekilde hazırlar.
   */
  const reuse = async (
    imagePath
  ) => {
    if (
      busyRef.current ||
      blocked
    ) {
      throw new Error(
        "Devam eden işlem tamamlanmadan görsel seçilemez."
      );
    }

    if (
      typeof imagePath !==
        "string" ||
      !imagePath.startsWith(
        "/uploads/"
      )
    ) {
      throw new Error(
        "Geçersiz medya görseli."
      );
    }

    busyRef.current = true;
    setBusy(true);
    setMediaError("");

    try {
      const result =
        await pageRequest(
          `${AZURA_MEDIA_LIBRARY_API}/reuse`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              image: imagePath,

              targetScope:
                DYNAMIC_PAGE_MEDIA_SCOPE,
            }),
          }
        );

      if (
        !result.image?.startsWith(
          "/uploads/dynamic-pages/"
        )
      ) {
        throw new Error(
          "Medya yeniden kullanım yanıtı geçersiz."
        );
      }

      return result.image;
    } catch (error) {
      setMediaError(
        error.message ||
          "Görsel yeniden kullanılamadı."
      );

      throw error;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return {
    adopt,
    save,
    reload,
    restore,
    blocked,
    busy,
    revision,
    origin,
    loadImages,

    media: {
      images,
      origin,
      loading: mediaLoading,
      error: mediaError,

      upload,

      // Yeni
      reuse,

      disabled:
        busy || blocked,
    },
  };
}