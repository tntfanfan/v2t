// Optional build / QA packages. The delivered web and mini-program do not load this file.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createRequire}=require('node:module');
function load(name,project){
 try{return createRequire(path.join(project,'package.json'))(name);}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
 const modules=process.env.CODEX_NODE_MODULES||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
 try{return require(path.join(modules,name));}catch(error){throw new Error(`Install ${name} in ${project}, or set CODEX_NODE_MODULES to your available node_modules folder.`,{cause:error});}
}
function browserOptions(){
 const candidates=[process.env.BROWSER_PATH,process.env['ProgramFiles(x86)']&&path.join(process.env['ProgramFiles(x86)'],'Microsoft/Edge/Application/msedge.exe'),process.env.ProgramFiles&&path.join(process.env.ProgramFiles,'Microsoft/Edge/Application/msedge.exe')];
 const executablePath=candidates.find(p=>p&&fs.existsSync(p));return executablePath?{headless:true,executablePath}:{headless:true};
}
module.exports={load,browserOptions};
