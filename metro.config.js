const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

// Workaround for Windows OneDrive Files On-Demand reparse points:
// Node's `fs.readdir(..., { withFileTypes: true })` reports OneDrive cloud-synced
// files (IO_REPARSE_TAG_CLOUD_*) as symbolic links (`Dirent.isSymbolicLink() === true`),
// which causes `@expo/metro-file-map` to treat regular files as broken symlinks.
// Falling back to `fs.lstatSync` when `isSymbolicLink()` is true accurately
// distinguishes real symlinks from OneDrive regular files and directories.
if (process.platform === "win32") {
  const origIsSymbolicLink = fs.Dirent.prototype.isSymbolicLink;
  const origIsFile = fs.Dirent.prototype.isFile;
  const origIsDirectory = fs.Dirent.prototype.isDirectory;

  function resolveReparseType(dirent) {
    if (dirent._resolvedType !== undefined) {
      return dirent._resolvedType;
    }
    const parent = dirent.parentPath ?? dirent.path;
    if (!parent) {
      dirent._resolvedType = 3;
      return 3;
    }
    try {
      const stat = fs.lstatSync(path.join(parent, dirent.name));
      dirent._resolvedType = stat.isSymbolicLink()
        ? 3
        : stat.isDirectory()
          ? 2
          : stat.isFile()
            ? 1
            : 0;
    } catch {
      dirent._resolvedType = 3;
    }
    return dirent._resolvedType;
  }

  fs.Dirent.prototype.isSymbolicLink = function isSymbolicLink() {
    return origIsSymbolicLink.call(this)
      ? resolveReparseType(this) === 3
      : false;
  };

  fs.Dirent.prototype.isFile = function isFile() {
    return (
      origIsFile.call(this) ||
      (origIsSymbolicLink.call(this) && resolveReparseType(this) === 1)
    );
  };

  fs.Dirent.prototype.isDirectory = function isDirectory() {
    return (
      origIsDirectory.call(this) ||
      (origIsSymbolicLink.call(this) && resolveReparseType(this) === 2)
    );
  };
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
