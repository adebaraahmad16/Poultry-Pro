import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { useToast } from '../../context/ToastContext';
import { validateAvatar } from '../../services/profileService';
import ProfileAvatar from './ProfileAvatar';

export default function ProfilePictureEditor() {
  const { profile, userId, fullName, avatarUrl, avatarError, avatarWarning, uploadAvatar, updateProfile, saving } = useProfile();
  const [draft,setDraft]=useState(null),[error,setError]=useState(''),[pending,setPending]=useState(false);
  const fileInput=useRef(null),lock=useRef(false),generation=useRef(0),preview=useRef('');
  const toast=useToast();
  const discard=()=>{if(preview.current)URL.revokeObjectURL(preview.current);preview.current='';setDraft(null);if(fileInput.current)fileInput.current.value='';};
  useEffect(()=>{generation.current++;discard();setError('');return()=>{generation.current++;if(preview.current)URL.revokeObjectURL(preview.current);preview.current='';};},[userId]);
  const choose=async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file||pending||saving)return;
    const version=++generation.current;setError('');
    let url='';
    try{
      await validateAvatar(file);
      url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();
      if(version!==generation.current){URL.revokeObjectURL(url);return;}
      if(preview.current)URL.revokeObjectURL(preview.current);preview.current=url;setDraft({file,url,remove:false});
    }catch(failure){if(url)URL.revokeObjectURL(url);if(version===generation.current)setError(failure.message || 'The image could not be previewed. Choose another image.');}
  };
  const save=async()=>{
    if(!draft||lock.current||saving)return;lock.current=true;setPending(true);setError('');const version=generation.current;
    try{
      if(draft.remove)await updateProfile({avatar_url:''});else await uploadAvatar(draft.file);
      if(version===generation.current){discard();toast.success(draft.remove?'Profile picture removed.':'Profile picture saved successfully.');}
    }catch(failure){if(version===generation.current)setError(failure.message);}
    finally{lock.current=false;setPending(false);}
  };
  const busy=pending||saving;
  return <section aria-label="Profile picture settings" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
    <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center gap-4">
      <div className="relative self-start shrink-0">
        <ProfileAvatar src={draft ? draft.url : avatarUrl} name={fullName} className="h-24 w-24 text-2xl" alt={draft?'New profile picture preview':'Your profile picture'} />
        <button type="button" aria-label="Change profile picture" disabled={busy} onClick={()=>fileInput.current?.click()} className="absolute -bottom-1 -right-1 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-emerald-700 text-white disabled:opacity-50"><Camera className="h-5 w-5" /></button>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <h4 className="font-semibold text-slate-900">Profile picture</h4><p className="text-sm text-slate-600">JPG, JPEG, PNG or WebP. Maximum 2 MB.</p>
        <input ref={fileInput} type="file" aria-label="Upload profile picture" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={busy} onChange={choose} className="sr-only" />
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={()=>fileInput.current?.click()} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">{avatarUrl?'Change image':'Upload image'}</button>
          {(profile?.avatar_url||avatarUrl||draft)&&<button type="button" disabled={busy} onClick={()=>{generation.current++;discard();setDraft({remove:true,url:''});setError('');}} className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Remove picture</button>}
        </div>
      </div>
    </div>
    {draft&&<div className="mt-4 space-y-3"><p className="text-sm text-slate-600">{draft.remove?'Save to remove your current picture.':'Preview only. Save to update your picture across PoultryPro.'}</p><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={save} className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending?'Saving picture…':'Save picture'}</button><button type="button" disabled={busy} onClick={()=>{generation.current++;discard();setError('');}} className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancel</button></div></div>}
    {pending&&<p role="status" className="mt-3 text-sm text-blue-700">{draft?.remove?'Removing profile picture…':'Uploading and saving profile picture…'}</p>}
    {avatarWarning&&<p role="status" className="mt-3 break-words text-sm text-amber-800">{avatarWarning}</p>}
    {(error||avatarError)&&<p role="alert" className="mt-3 break-words text-sm text-red-700">{error||avatarError}</p>}
  </section>;
}
