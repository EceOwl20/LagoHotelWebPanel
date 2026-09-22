const lagoRoom = (namespace, pageKey, label, background = false) => Object.freeze({
  namespace, pageKey, label, background, hotel: "lago",
});

export const LAGO_ROOM_DETAIL_CONFIGS = Object.freeze({
  SuperiorRoom: lagoRoom("SuperiorRoom", "superiorroom", "Superior Oda"),
  FamilyRoom: lagoRoom("FamilyRoom", "familyroom", "Aile Odası"),
  SwimupRoom: lagoRoom("SwimupRoom", "swimuproom", "Swim Up Oda", true),
  FamilySwimupRoom: lagoRoom("FamilySwimupRoom", "familyswimup", "Aile Swim Up Oda", true),
  DuplexFamilyRoom: lagoRoom("DuplexFamilyRoom", "duplexfamilyroom", "Dubleks Aile Odası", true),
  DisabledRoom: lagoRoom("DisabledRoom", "disableroom", "Engelli Odası"),
  TinyVilla: lagoRoom("TinyVilla", "tinyvilla", "Tiny Villa", true),
});

export const AZURA_ROOM_DETAIL_CONFIGS = Object.freeze({
  deluxe: Object.freeze({
    hotel: "azura", roomKey: "deluxe", pageKey: "deluxeroom", label: "Deluxe Oda", background: true,
    imagesScope: "room-detail-deluxe",
    backgroundFields: Object.freeze(["subtitle", "title", "text"]),
    galleryIds: Object.freeze(Array.from({ length: 9 }, (_, i) => `deluxe-gallery-${i + 1}`)),
    tourIds: Object.freeze(["land", "sea", "partialSea"]),
    optionIds: Object.freeze(["family", "fantasy"]),
  }),
  family: Object.freeze({
    hotel: "azura", roomKey: "family", pageKey: "familyroom", label: "Family Oda", background: true,
    imagesScope: "room-detail-family",
    backgroundFields: Object.freeze(["subtitle", "title", "text", "list1", "list2"]),
    galleryIds: Object.freeze(Array.from({ length: 12 }, (_, i) => `family-gallery-${i + 1}`)),
    tourIds: Object.freeze(["land", "sea"]),
    optionIds: Object.freeze(["deluxe", "fantasy"]),
  }),
});

export function azuraRoomDetailConfig(roomKey) {
  return Object.hasOwn(AZURA_ROOM_DETAIL_CONFIGS, roomKey) ? AZURA_ROOM_DETAIL_CONFIGS[roomKey] : null;
}

export function canSelectRoomDetailImage(config, field, asset) {
  const folder = field.path[0] === "otherOptions" ? "room-options" : null;
  return asset.image.startsWith(`/uploads/pages/${config.pageKey}/`) ||
    Boolean(folder && asset.image.startsWith(`/uploads/pages/${folder}/`));
}
