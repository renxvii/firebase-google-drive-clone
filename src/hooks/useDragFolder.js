import { useDrag } from "react-dnd";

export default function useDragFolder(folder) {
  return useDrag({
    type: "folder",
    item: { ...folder, type: "folder" },
  });
}
