// Test-only Supabase double. Never imported by the application or production build.
export function dashboardDatabase(initial = {}) {
  const state = {
    userId: initial.userId || 'farmer-a', profileReadDelay: 0, writeDelay: 0, failure: null, calls: [], uploads: new Map(),
    rows: initial.rows || {
      profiles: [
        { id: 'farmer-a', email: 'farmer-a@example.invalid', full_name: 'First Farmer', phone: '08000000001', role: 'farmer', farm_id: 'farm-a', avatar_url: '', account_status: 'Active' },
        { id: 'farmer-b', email: 'farmer-b@example.invalid', full_name: 'Second Farmer', phone: '08000000002', role: 'farmer', farm_id: 'farm-b', avatar_url: '', account_status: 'Active' },
        { id: 'admin-a', email: 'admin-a@example.invalid', full_name: 'Test Administrator', role: 'super_admin', avatar_url: '' },
      ],
      farms: [{ id:'farm-a',owner_id:'farmer-a',name:'First Farm',poultry_types:['Broilers'],currency:'NGN',weight_unit:'kg' },{id:'farm-b',owner_id:'farmer-b',name:'Second Farm',poultry_types:['Layers']}],
      farm_subscriptions: [{user_id:'farmer-a',farm_id:'farm-a',plan_id:'basic',status:'trial',trial_ends_at:'2027-01-01T00:00:00.000Z',renewal_date:'2027-01-01T00:00:00.000Z',agreed_price:2500,billing_cycle:'monthly'}],
      subscription_plans: [{id:'basic',name:'Basic',monthly_price:2500,annual_price:25000,max_flocks:3,max_birds:500,max_poultry_types:1,max_users:1,max_farms:1,capabilities:{},status:'Active',is_most_popular:false}],
      app_settings: [], notifications: [], flocks: [], inventory: [], tasks: [],
    },
  };
  const listeners = new Set();
  const clone = value => JSON.parse(JSON.stringify(value));
  const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
  const profile = id => state.rows.profiles.find(row=>row.id===id);
  const isAdmin = id => ['admin','super_admin','Super Admin'].includes(profile(id)?.role);
  const ownsFarm = (id,farmId) => isAdmin(id) || state.rows.farms.some(f=>f.id===farmId&&f.owner_id===id);
  const user = () => state.userId ? {id:state.userId,email:profile(state.userId)?.email} : null;
  const session = () => user() ? {user:user(),access_token:'fixture-token'} : null;
  const emit = event => listeners.forEach(callback=>callback(event,session()));
  const allowed = (table,row,id,write=false) => {
    if(!id)return table==='subscription_plans'&&!write;
    if(table==='profiles')return row.id===id||isAdmin(id);
    if(table==='farms')return row.owner_id===id||isAdmin(id);
    if(table==='app_settings')return row.owner_id===id&&row.id.startsWith('user:'+id+':')||row.owner_id==null&&isAdmin(id);
    if(table==='subscription_plans')return !write||isAdmin(id);
    if(table==='notifications')return isAdmin(id)||(!write&&row.user_id===id);
    return ownsFarm(id,row.farm_id);
  };
  const db = {
    state, supabaseUrl: 'https://fixture.supabase.invalid',
    auth: {
      getUser:async()=>({data:{user:user()},error:null}), getSession:async()=>({data:{session:session()},error:null}),
      onAuthStateChange(callback){listeners.add(callback);queueMicrotask(()=>callback('INITIAL_SESSION',session()));return{data:{subscription:{unsubscribe:()=>listeners.delete(callback)}}};},
      async signInWithPassword({email,password}){const found=state.rows.profiles.find(p=>p.email===email);if(!found||password!=='fixture-password')return{data:{user:null},error:{message:'Invalid credentials'}};state.userId=found.id;emit('SIGNED_IN');return{data:{user:user(),session:session()},error:null};},
      async signOut(){state.userId=null;emit('SIGNED_OUT');return{error:null};},
      async updateUser(){emit('USER_UPDATED');return{data:{user:user()},error:null};},
    },
    storage:{from(bucket){return{
      async upload(path,file){if(bucket!=='avatars'||!path.startsWith(state.userId+'/'))return{error:{message:'Storage permission denied'}};state.uploads.set(path,file);return{data:{path},error:null};},
      getPublicUrl:path=>({data:{publicUrl:`https://fixture.supabase.invalid/storage/v1/object/public/${bucket}/${path}`}}),
      async createSignedUrl(path){return{data:{signedUrl:`https://fixture.supabase.invalid/storage/v1/object/sign/${bucket}/${path}?token=fixture`},error:null};},
      async remove(paths){paths.forEach(path=>state.uploads.delete(path));return{error:null};},
    };}},
    from(table){
      let action='select',payload,options={},filters=[],single=false,maybe=false,head=false,orderKey,descending=false,start=0,end=Infinity;
      const q={
        select(_columns,opts){head=opts?.head;return q;},eq(key,value){filters.push(row=>row[key]===value);return q;},is(key,value){filters.push(row=>row[key]==value);return q;},in(key,values){filters.push(row=>values.includes(row[key]));return q;},
        order(key,opts){orderKey=key;descending=opts?.ascending===false;return q;},range(a,b){start=a;end=b;return q;},
        limit(value){end=start+value-1;return q;},or(expression){
          const owner=expression.match(/user_id\.eq\.([^,]+)/)?.[1],farm=expression.match(/farm_id\.eq\.([^,)]+)/)?.[1];
          if(owner)filters.push(row=>row.user_id===owner||row.user_id==null&&row.farm_id===farm);
          return q;
        },
        insert(value){action='insert';payload=value;return q;},upsert(value,opts){action='upsert';payload=value;options=opts||{};return q;},update(value){action='update';payload=value;return q;},delete(){action='delete';return q;},
        single(){single=true;return q;},maybeSingle(){single=true;maybe=true;return q;},
        async then(resolve,reject){try{
          const id=state.userId;
          state.calls.push({table,action,payload:payload?clone(payload):undefined});
          if(state.failure?.table===table&&(!state.failure.action||state.failure.action===action)){resolve({data:null,error:{message:state.failure.message||'Database permission denied'}});return;}
          let rows=state.rows[table]||(state.rows[table]=[]);
          let data=rows.filter(row=>allowed(table,row,id)&&filters.every(filter=>filter(row)));
          if(action==='insert'||action==='upsert'){
            const input=clone(Array.isArray(payload)?payload:[payload]);
            if(input.some(row=>!allowed(table,row,id,true)))throw Error('Row-level security denied this write');
            data=[];
            for(const row of input){const previous=rows.find(r=>r.id===row.id);if(previous){if(action==='insert')throw Error('Duplicate record');if(options.ignoreDuplicates)continue;if(!allowed(table,previous,id,true))throw Error('Row-level security denied this write');Object.assign(previous,row);data.push(previous);}else{rows.push({...row,created_at:new Date().toISOString()});data.push(rows.at(-1));}}
          } else if(action==='update'){
            if(table==='profiles'&&!isAdmin(id)&&['role','account_status'].some(key=>payload[key]!==undefined&&data.some(row=>row[key]!==payload[key])))throw Error('Administrator authorization required');
            data=data.filter(row=>allowed(table,row,id,true));data.forEach(row=>Object.assign(row,clone(payload),{updated_at:new Date().toISOString()}));
          } else if(action==='delete'){
            data=data.filter(row=>allowed(table,row,id,true));state.rows[table]=rows.filter(row=>!data.includes(row));
          }
          if(orderKey)data.sort((a,b)=>String(a[orderKey]||'').localeCompare(String(b[orderKey]||''))*(descending?-1:1));
          const count=data.length;data=data.slice(start,end+1);
          const error=single&&!maybe&&data.length!==1?{message:'No authorized row was returned'}:null;
          const result={data:head?null:single?clone(data[0]||null):clone(data),error,count};
          if(table==='profiles'&&action==='select'&&state.profileReadDelay)await delay(state.profileReadDelay);
          else if(action!=='select'&&state.writeDelay)await delay(state.writeDelay);
          resolve(result);
        }catch(error){resolve({data:null,error:{message:error.message}});}},
      };return q;
    },
    async rpc(name,args){
      if(name==='is_admin')return{data:isAdmin(state.userId),error:null};
      if(name==='apply_inventory_movement'){
        const item=state.rows.inventory.find(row=>row.id===args.p_item_id&&row.farm_id===args.p_farm_id&&ownsFarm(state.userId,row.farm_id));
        if(!item)return{error:{message:'Record not found'}};
        const next=Number(item.quantity)+(args.p_type==='addition'?1:-1)*args.p_quantity;
        if(next<0)return{error:{message:'Stock usage exceeds the available quantity'}};
        item.quantity=next;item.last_movement={type:args.p_type,quantity:args.p_quantity,date:args.p_date,notes:args.p_notes};return{data:[clone(item)],error:null};
      }
      return{error:{message:'The test double does not execute PostgreSQL functions: '+name}};
    },
  };
  return db;
}
