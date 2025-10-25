export type DragPayload = {
  linkId: string;
  from: "library" | "profile";
  fromProfileId?: string;
  token?: string;
};