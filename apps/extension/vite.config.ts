import { defineConfig } from 'vite';
import path from 'path';
import pkg from './package.json' with { type: 'json' };

const extName = pkg.name;
const version = pkg.version;

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    build: {
      outDir: `dist/resources/extensions-${extName}`,
      emptyOutDir: true,
      lib: {
        entry: path.resolve(__dirname, 'src/index.tsx'),
        name: 'extensions.resources',
        fileName: () =>
          isProd ? `extension-${extName}-bundle-${version}.min.js` : `extensions-${extName}.js`,
        formats: ['umd'],
      },
      rollupOptions: {
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
        external: ['react', 'react-dom'],
      },
      minify: isProd,
      sourcemap: !isProd,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json', '.scss', '.css'],
    },
    css: {
      preprocessorOptions: {
        scss: {},
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    plugins: [
      {
        name: 'argocd-uploader',
        apply: 'build',
        writeBundle: async function () {
          if (isProd) {
            return;
          }
          console.log('🚀 ArgoCD uploader plugin triggered!');
          try {
            const { execSync } = await import('child_process');
            const { existsSync } = await import('fs');

            // Match the production build file name so the path is stable
            const builtFileName = isProd
              ? `extension-${extName}-bundle-${version}.min.js`
              : `extensions-${extName}.js`;
            const extensionPath = path.resolve(
              process.cwd(),
              `dist/resources/extensions-${extName}/${builtFileName}`,
            );

            console.log(`🔍 Looking for extension at: ${extensionPath}`);
            if (!existsSync(extensionPath)) {
              console.log('⚠️  Extension not found, build may have failed');
              return;
            }

            console.log('✅ Extension found, proceeding with upload...');
            console.log('📤 Copying extension to ArgoCD server pod...');

            try {
              // Get the ArgoCD server pod name
              const podName = execSync(
                'kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-server -o jsonpath="{.items[0].metadata.name}" 2>/dev/null',
                {
                  encoding: 'utf8',
                  stdio: ['pipe', 'pipe', 'pipe'],
                },
              ).trim();

              if (!podName) {
                console.log('⚠️  No ArgoCD server pod found in current kubectl context');
                return;
              }

              // Create directory in pod and copy extension
              const podExtensionsDir = '/tmp/extensions/resources/extensions-argo-cd-assistant';
              execSync(`kubectl exec ${podName} -n argocd -- mkdir -p ${podExtensionsDir}`);
              execSync(
                `kubectl cp "${extensionPath}" argocd/${podName}:${podExtensionsDir}/extensions-${extName}.js`,
              );

              console.log(`✅ Extension copied to ArgoCD server pod: ${podName}`);
            } catch {
              console.log(
                '⚠️  kubectl command failed - make sure ArgoCD is running in your current kubectl context',
              );
            }
          } catch (error) {
            console.error('❌ Failed to copy extension to ArgoCD pod:', error);
          }
        },
      },
    ],
  };
});
