/**
 * Copyright © 2026 Wenze Wei. All Rights Reserved.
 *
 * This file is part of Xi.
 * The Xi project belongs to the Dunimd Team.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface FileAssociation {
  extensions: string[];
  appId: string;
  icon?: string;
  description?: string;
}

export const defaultFileAssociations: FileAssociation[] = [
  {
    extensions: ["txt", "md", "log", "json", "yaml", "yml", "toml", "ini", "cfg", "conf"],
    appId: "text-editor",
    description: "Text files",
  },
  {
    extensions: ["py", "js", "ts", "jsx", "tsx", "java", "c", "cpp", "h", "hpp", "cs", "go", "rs", "rb", "php", "swift", "kt", "scala", "lua", "sh", "bat", "ps1"],
    appId: "code-editor",
    description: "Source code files",
  },
  {
    extensions: ["html", "css", "scss", "sass", "less", "xml", "svg"],
    appId: "code-editor",
    description: "Web files",
  },
  {
    extensions: ["png", "jpg", "jpeg", "gif", "bmp", "ico", "webp", "tiff", "tif"],
    appId: "image-viewer",
    description: "Image files",
  },
  {
    extensions: ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "m4v"],
    appId: "media-player",
    description: "Video files",
  },
  {
    extensions: ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"],
    appId: "media-player",
    description: "Audio files",
  },
  {
    extensions: ["pdf"],
    appId: "pdf-reader",
    description: "PDF documents",
  },
  {
    extensions: ["doc", "docx", "xls", "xlsx", "ppt", "pptx"],
    appId: "office-suite",
    description: "Office documents",
  },
  {
    extensions: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"],
    appId: "archive-manager",
    description: "Archive files",
  },
];

export function getAppForFile(filename: string, associations: FileAssociation[] = defaultFileAssociations): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;

  for (const assoc of associations) {
    if (assoc.extensions.includes(ext)) {
      return assoc.appId;
    }
  }

  return null;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isDirectory(item: { is_dir?: boolean }): boolean {
  return item.is_dir === true;
}
