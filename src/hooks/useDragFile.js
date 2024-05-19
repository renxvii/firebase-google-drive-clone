import { useDrag } from "react-dnd";

export default function useDragFile(file) {
  return useDrag({
    type: "file",
    item: { ...file, type: "file" },
  });
}
