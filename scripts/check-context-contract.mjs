// Check the real provider contract and render purity without a browser or live data.
import {build} from 'esbuild';
import Module from 'node:module';
import {resolve} from 'node:path';

const source=`
const React=require('react');
const assert=require('node:assert/strict');
const {renderToStaticMarkup}=require('react-dom/server');
const {FarmProvider,useRawFarm,useFarm}=require('./src/context/FarmContext.jsx');
const {PoultryProvider,usePoultry}=require('./src/context/PoultryContext.jsx');
const scope=require('./src/services/farmScope.js');
function Probe(){
 const farm=useRawFarm(),poultry=usePoultry();
 assert.ok(Array.isArray(farm.availableTypeIds));
 assert.equal(farm.activeTypeId,'all');
 assert.equal(typeof farm.selectPoultryType,'function');
 assert.equal(poultry.selectPoultryType,farm.selectPoultryType);
 assert.deepEqual(poultry.selectedTypes,[]);
 assert.equal(poultry.activeType,null);
 assert.equal(poultry.isAllView,true);
 assert.equal(poultry.showSelector,false);
 assert.ok('subscription' in farm && 'metrics' in farm && 'refreshAllData' in farm);
 return React.createElement('p',null,'Ready');
}
for(const loading of [true,false]){
 globalThis.__contextAuth={loading,isLoggedIn:false,user:null};
 scope.setSelectedPoultryType('turkeys');scope.setSelectedFarmId('render-purity-fixture');
 assert.equal(renderToStaticMarkup(React.createElement(FarmProvider,null,React.createElement(PoultryProvider,null,React.createElement(Probe)))),'<p>Ready</p>');
 assert.equal(scope.getSelectedPoultryType(),'turkeys','Rendering must not mutate the service poultry scope');
 assert.equal(scope.getSelectedFarmId(),'render-purity-fixture','Rendering must not mutate the service farm scope');
}
assert.throws(()=>renderToStaticMarkup(React.createElement(PoultryProvider,null,React.createElement('p',null,'Invalid boundary'))),/useRawFarm must be used within FarmProvider/);
function MissingFarmConsumer(){useFarm();return null;}
assert.throws(()=>renderToStaticMarkup(React.createElement(MissingFarmConsumer)),/useRawFarm must be used within FarmProvider/);
console.log('PASS real Farm/Poultry context contracts during Auth loading and signed-out rendering, render purity, preserved context fields, and explicit missing-provider diagnostics.');
`;
const result=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',jsx:'automatic',define:{'import.meta.env':'{}'},plugins:[{name:'context-contract-fixtures',setup(builder){
 builder.onLoad({filter:/context[\\/]AuthContext\.jsx$/},()=>({contents:'export const useAuth=()=>globalThis.__contextAuth;',loader:'js'}));
 builder.onLoad({filter:/subscriptions[\\/]usePlanCatalog\.js$/},()=>({contents:'export const usePlanCatalog=()=>({plans:[],loading:false});',loader:'js'}));
 builder.onLoad({filter:/lib[\\/]supabaseClient\.js$/},()=>({contents:'export const supabase=null;export const isSupabaseConfigured=()=>false;',loader:'js'}));
}}]});
const filename=resolve('.ui-checks/context-contract.cjs');const mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(result.outputFiles[0].text,filename);
