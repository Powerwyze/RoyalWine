import blackIrish from "@/assets/black-irish-clean-pose.png.asset.json";
import mexxo from "@/assets/mexxo-masquerade.jpg.asset.json";
import mariah from "@/assets/mariah-carey-masquerade.jpg.asset.json";
import approvedLogo from "@/assets/black-irish-logo.jpg.asset.json";
import type { SceneId } from "./kiosk";

/** Approved assets only; never derive reference selection from request fields. */
export function getSceneReferences(scene: SceneId) {
  const template = { "black-irish": blackIrish, mexxo, mariah }[scene];
  return { template, brand: scene === "black-irish" ? approvedLogo : undefined };
}