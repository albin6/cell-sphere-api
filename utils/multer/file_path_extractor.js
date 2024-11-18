export function file_path_extractor(file_path) {
  const path = file_path.split("/").pop();
  return path;
}
