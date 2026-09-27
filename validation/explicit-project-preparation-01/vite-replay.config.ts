import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
export default defineConfig({
 plugins:[react()], envDir:false,
 resolve:{alias:{"@":path.resolve(process.cwd(),"src"),
   ...(!process.argv.some(arg=>arg.includes("vite-node")) ? {"node:crypto":path.resolve(process.cwd(),"src/features/knowledge-engine/browser-crypto.ts")} : {})}},
 define:{"import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME":JSON.stringify("TERRA"),"import.meta.env.VITE_AUTONOMOUS_PROJECT_BUILD":JSON.stringify("ON")},
 server:{host:"127.0.0.1",port:4188,strictPort:true,proxy:{"/api":{target:"http://127.0.0.1:4187",changeOrigin:false,headers:{"x-forwarded-host":"127.0.0.1:4188"}}}},
});
