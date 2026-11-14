// Vite's optional Lightning CSS transformer is unused: this project uses PostCSS.
// Omit that optional peer to keep the selected development toolchain permissively licensed.
module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === 'vite') {
        if (pkg.peerDependencies) delete pkg.peerDependencies.lightningcss;
        if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.lightningcss;
      }
      return pkg;
    },
  },
};
