import React from 'react';

// Small local SVG set used by the landing page and the updated admin shell.
const paths = {
 Search:'M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14 M15 15l6 6',
 Plus:'M12 4v16 M4 12h16',
 Phone:'M6 3l4 5-3 3c2 3 3 4 6 6l3-3 5 4c-1 5-5 4-8 2C7 17 3 12 2 7c0-2 1-4 4-4z',
 ExternalLink:'M14 3h7v7 M21 3L10 14 M10 4H3v17h17v-8',
 Facebook:'M15 22V13h3l1-4h-4V6c0-2 1-2 4-2V1c-5-1-8 1-8 5v3H8v4h3v9',
 Twitter:'M4 3l16 18 M20 3L4 21',
 Instagram:'M7 3h10c3 0 4 1 4 4v10c0 3-1 4-4 4H7c-3 0-4-1-4-4V7c0-3 1-4 4-4z M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0 M17 7h.01',
 Linkedin:'M4 9v12 M4 4h.01 M10 21V9 M10 14c0-6 10-6 10 0v7',
 Youtube:'M3 6c6-2 12-2 18 0v12c-6 2-12 2-18 0z M10 8l6 4-6 4z',

 Bird:'M4 15c0-5 3-9 7-9 3 0 5 2 5 5l4 2-4 2c-1 4-4 6-8 5L4 22l1-5z M11 10h.01',
 Egg:'M12 3c-3 0-7 7-7 12a7 7 0 0 0 14 0c0-5-4-12-7-12z',
 Wheat:'M12 22V4 M12 9C5 10 4 7 4 4c5 0 8 1 8 5z M12 15c7 1 8-2 8-5-5 0-8 1-8 5z M12 20c-7 0-8-3-8-6 5 0 8 2 8 6z',
 Users:'M16 21v-3c0-3-8-3-8 0v3 M9 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0 M20 20v-3c0-2-2-3-3-3 M18 4c4 1 4 5 0 6',
 User:'M4 21v-3c0-6 16-6 16 0v3 M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0',
 ShieldCheck:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
 ShieldAlert:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M12 8v5 M12 16h.01',
 CheckCircle2:'M22 11a10 10 0 1 1-5-8 M7 11l4 4L22 4',
 Check:'M5 12l4 4L20 5',
 TrendingUp:'M3 17l6-6 4 4 8-10 M15 5h6v6',
 BarChart3:'M3 3v18h18 M7 16v-4 M12 16V6 M17 16V9',
 Clock:'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M12 7v5l4 2',
 ArrowRight:'M4 12h16 M14 6l6 6-6 6',
 ChevronDown:'M6 9l6 6 6-6',
 ChevronLeft:'M15 5l-7 7 7 7',
 ChevronRight:'M9 5l7 7-7 7',
 X:'M6 6l12 12 M18 6L6 18',
 Menu:'M4 6h16 M4 12h16 M4 18h16',
 LayoutDashboard:'M3 3h7v8H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 15h7v6H3z',
 Building2:'M5 22V3h14v19 M2 22h20 M9 7h1 M14 7h1 M9 11h1 M14 11h1 M10 22v-6h4v6',
 CreditCard:'M3 5h18v14H3z M3 9h18 M6 15h4',
 DollarSign:'M12 2v20 M17 6H9a4 4 0 0 0 0 8h6a3 3 0 0 1 0 6H6',
 PiggyBank:'M4 9c2-6 13-6 15 1l3 1v5l-3 1-1 4h-3l-1-3H9l-1 3H5l-1-5H2v-5z M8 6V3l4 2 M16 10h.01',
 NotebookPen:'M5 3h13v18H5z M2 7h5 M2 12h5 M2 17h5 M9 8h5 M9 12h4',
 Package:'M3 6l9-4 9 4v12l-9 4-9-4z M3 6l9 5 9-5 M12 11v11',
 Bell:'M5 17h14l-2-4V8a5 5 0 0 0-10 0v5z M10 21h4',
 Headphones:'M3 13v-2a9 9 0 0 1 18 0v2 M3 12h4v8H3z M17 12h4v8h-4z',
 Globe:'M3 12h18 M12 3c-7 6-7 12 0 18 7-6 7-12 0-18 M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0',
 UserCheck:'M3 21v-3c0-5 12-5 12 0v3 M6 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0 M16 10l2 2 4-5',
 Settings:'M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
 Activity:'M2 12h5l3-8 4 16 3-8h5',
 LogOut:'M9 3H3v18h6 M9 12h12 M16 7l5 5-5 5',
 AlertTriangle:'M12 3L2 21h20z M12 9v5 M12 17h.01',
 Star:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
 Info:'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18 M12 11v6 M12 7h.01',
 Sprout:'M12 22V10 M12 12C3 12 3 8 3 4c7 0 9 3 9 8z M12 16c9 0 9-4 9-8-7 0-9 3-9 8z',
 Feather:'M4 21L17 8 M4 16c-1-5 8-14 14-13 7 4-1 16-9 16z',
 Rocket:'M9 15l-4-4C9 4 15 2 22 2c0 7-2 13-9 17z M5 16l-3 6 6-3 M14 8h.01',
};
Object.assign(paths, {
  Calendar:'M3 5h18v16H3z M3 10h18 M7 2v6 M17 2v6',
  Layers:'M2 7l10-5 10 5-10 5z M2 12l10 5 10-5 M2 17l10 5 10-5',
  LayoutGrid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  Eye:'M2 12c6-10 14-10 20 0-6 10-14 10-20 0z M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  EyeOff:'M3 3l18 18 M3 9l-1 3c6 10 14 10 20 0l-4-5 M9 5c4-2 9 0 13 7',
  HeartPulse:'M12 21C-4 11 4-1 12 7c8-8 16 4 0 14z M3 12h5l2-4 3 8 2-4h6',
  Syringe:'M5 15l4 4 11-11-4-4z M14 2l8 8 M3 21l4-4 M8 10l6 6',
  Pill:'M4 12l8-8c7-7 15 1 8 8l-8 8c-7 7-15-1-8-8z M8 8l8 8',
  Scale:'M12 2v20 M4 6h16 M7 6L3 15h8z M17 6l-4 9h8z M7 22h10',
  Receipt:'M4 2l3 2 3-2 3 2 3-2 4 2v18l-4-2-3 2-3-2-3 2-3-2z M8 8h8 M8 12h8 M8 16h5',
  Filter:'M2 3h20l-8 9v8l-4 2V12z',
  Sliders:'M5 2v5 M5 11v11 M2 7h6v4H2z M17 2v11 M17 17v5 M14 13h6v4h-6z',
  Trash2:'M3 6h18 M6 6l1 16h10l1-16 M9 6V2h6v4 M10 10v8 M14 10v8',
  Edit3:'M3 16L17 2l5 5L8 21H3z M14 5l5 5',
  Download:'M12 2v13 M7 10l5 5 5-5 M3 16v6h18v-6',
  Upload:'M12 16V3 M7 8l5-5 5 5 M3 16v6h18v-6',
  Save:'M3 2h15l4 4v16H3z M7 2v7h10V2 M7 22V13h11v9',
  Printer:'M6 8V2h12v6 M6 18H2V8h20v10h-4 M6 14h12v8H6z M18 11h.01',
  Lock:'M5 10h14v12H5z M8 10V6a4 4 0 0 1 8 0v4 M12 15v3',
  Key:'M3 7a5 5 0 1 0 10 0 5 5 0 1 0-10 0 M11 11l10 10 M16 16l3-3 M19 19l3-3',
  Mail:'M2 4h20v16H2z M2 5l10 8L22 5',
  MapPin:'M12 22S3 12 3 8a9 9 0 0 1 18 0c0 4-9 14-9 14z M9 8a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  Send:'M2 2l20 10-20 10 5-10z M7 12h15',
  MessageSquare:'M2 2h20v15H8l-6 5z M6 7h12 M6 12h8',
  Home:'M2 11L12 2l10 9 M5 9v13h14V9 M9 22v-8h6v8',
  Database:'M3 5c0-5 18-5 18 0s-18 5-18 0z M3 5v14c0 5 18 5 18 0V5 M3 12c0 5 18 5 18 0',
  Server:'M2 2h20v8H2z M2 14h20v8H2z M6 6h.01 M6 18h.01 M11 6h7 M11 18h7',
  Monitor:'M2 2h20v15H2z M12 17v5 M7 22h10',
  Smartphone:'M6 2h12v20H6z M10 18h4 M10 5h4',
  Laptop:'M5 2h14v14H5z M1 16h22l-2 5H3z',
  HardDrive:'M5 3h14l3 12v6H2v-6z M2 15h20 M6 18h.01 M10 18h.01',
  Camera:'M2 6h5l2-4h6l2 4h5v16H2z M8 14a4 4 0 1 0 8 0 4 4 0 1 0-8 0',
  Image:'M2 2h20v20H2z M2 18l6-6 5 5 4-4 5 5 M6 7h.01',
  Wifi:'M2 8c6-6 14-6 20 0 M6 12c4-4 8-4 12 0 M9 16c2-2 4-2 6 0 M12 20h.01',
  RefreshCw:'M21 10a9 9 0 0 0-16-6L2 7 M2 2v5h5 M3 14a9 9 0 0 0 16 6l3-3 M22 22v-5h-5',
  Lightbulb:'M8 16c-8-9 0-18 7-13 6 4 4 9 1 13z M8 19h8 M10 22h4',
  Moon:'M21 14A10 10 0 0 1 10 3 10 10 0 1 0 21 14z',
  Sun:'M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0 M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4 4l2 2 M18 18l2 2 M20 4l-2 2 M6 18l-2 2',
  Zap:'M13 1L2 14h9v9l11-13h-9z',
  Sparkles:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z',
  PieChart:'M12 2v10h10A10 10 0 0 0 12 2z M8 3a10 10 0 1 0 13 13H8z',
  Radio:'M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0 M4 5a10 10 0 0 0 0 14 M20 5a10 10 0 0 1 0 14',
  TrendingDown:'M3 5l6 6 4-4 8 12 M15 19h6v-6',
  ArrowLeft:'M20 12H4 M10 6l-6 6 6 6',
  ArrowUpRight:'M5 19L19 5 M5 5h14v14',
  ArrowDownRight:'M5 5l14 14 M5 19h14V5',
  MinusCircle:'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0 M7 12h10',
  PlusCircle:'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0 M7 12h10 M12 7v10',
  XCircle:'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0 M8 8l8 8 M16 8l-8 8',
  AlertCircle:'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0 M12 7v6 M12 17h.01',
  HelpCircle:'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0 M9 8c0-4 8-3 5 1l-2 2v3 M12 17h.01',
  CheckSquare:'M3 3h18v18H3z M6 12l4 4 8-9',
  CheckCheck:'M1 12l4 4 9-11 M10 15l3 3L23 6',
  Inbox:'M2 14h8l2 4h4l2-4h4V5H2z M2 14V5h20v9',
});
paths.Building=paths.Building2;paths.FileText=paths.NotebookPen;paths.BarChart2=paths.BarChart3;
paths.SlidersHorizontal=paths.Sliders;paths.Shield=paths.ShieldCheck;
const icon = name => function LocalIcon({className='w-5 h-5',size=24,strokeWidth=1.8,...props}) {
 return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}><path d={paths[name] || paths.Globe}/></svg>;
};

export const Activity = icon('Activity');
export const AlertTriangle = icon('AlertTriangle');
export const ArrowRight = icon('ArrowRight');
export const BarChart3 = icon('BarChart3');
export const Bell = icon('Bell');
export const Bird = icon('Bird');
export const Building2 = icon('Building2');
export const CheckCircle2 = icon('CheckCircle2');
export const ChevronDown = icon('ChevronDown');
export const ChevronLeft = icon('ChevronLeft');
export const ChevronRight = icon('ChevronRight');
export const Clock = icon('Clock');
export const CreditCard = icon('CreditCard');
export const DollarSign = icon('DollarSign');
export const Egg = icon('Egg');
export const ExternalLink = icon('ExternalLink');
export const Facebook = icon('Facebook');
export const Globe = icon('Globe');
export const Headphones = icon('Headphones');
export const Info = icon('Info');
export const Instagram = icon('Instagram');
export const LayoutDashboard = icon('LayoutDashboard');
export const Linkedin = icon('Linkedin');
export const LogOut = icon('LogOut');
export const Menu = icon('Menu');
export const NotebookPen = icon('NotebookPen');
export const Package = icon('Package');
export const Phone = icon('Phone');
export const PiggyBank = icon('PiggyBank');
export const Plus = icon('Plus');
export const Search = icon('Search');
export const Settings = icon('Settings');
export const ShieldAlert = icon('ShieldAlert');
export const ShieldCheck = icon('ShieldCheck');
export const Star = icon('Star');
export const TrendingUp = icon('TrendingUp');
export const Twitter = icon('Twitter');
export const User = icon('User');
export const UserCheck = icon('UserCheck');
export const Users = icon('Users');
export const Wheat = icon('Wheat');
export const X = icon('X');
export const Youtube = icon('Youtube');

export const AlertCircle = icon('AlertCircle');
export const ArrowDownRight = icon('ArrowDownRight');
export const ArrowLeft = icon('ArrowLeft');
export const ArrowUpRight = icon('ArrowUpRight');
export const BarChart2 = icon('BarChart2');
export const Building = icon('Building');
export const Calendar = icon('Calendar');
export const Camera = icon('Camera');
export const Check = icon('Check');
export const CheckCheck = icon('CheckCheck');
export const CheckSquare = icon('CheckSquare');
export const Database = icon('Database');
export const Download = icon('Download');
export const Edit3 = icon('Edit3');
export const Edit2 = icon('Edit3');
export const Edit = icon('Edit3');
export const Eye = icon('Eye');
export const EyeOff = icon('EyeOff');
export const FileText = icon('FileText');
export const Filter = icon('Filter');
export const HardDrive = icon('HardDrive');
export const HeartPulse = icon('HeartPulse');
export const HelpCircle = icon('HelpCircle');
export const Home = icon('Home');
export const Image = icon('Image');
export const Key = icon('Key');
export const Laptop = icon('Laptop');
export const Layers = icon('Layers');
export const LayoutGrid = icon('LayoutGrid');
export const Lightbulb = icon('Lightbulb');
export const Lock = icon('Lock');
export const Mail = icon('Mail');
export const MapPin = icon('MapPin');
export const MessageSquare = icon('MessageSquare');
export const MinusCircle = icon('MinusCircle');
export const Monitor = icon('Monitor');
export const Moon = icon('Moon');
export const PieChart = icon('PieChart');
export const Pill = icon('Pill');
export const PlusCircle = icon('PlusCircle');
export const Printer = icon('Printer');
export const Radio = icon('Radio');
export const Receipt = icon('Receipt');
export const RefreshCw = icon('RefreshCw');
export const Save = icon('Save');
export const Scale = icon('Scale');
export const Send = icon('Send');
export const Server = icon('Server');
export const Shield = icon('Shield');
export const Sliders = icon('Sliders');
export const SlidersHorizontal = icon('SlidersHorizontal');
export const Smartphone = icon('Smartphone');
export const Sparkles = icon('Sparkles');
export const Sun = icon('Sun');
export const Syringe = icon('Syringe');
export const Trash2 = icon('Trash2');
export const TrendingDown = icon('TrendingDown');
export const Upload = icon('Upload');
export const Wifi = icon('Wifi');
export const XCircle = icon('XCircle');
export const Zap = icon('Zap');
export const Inbox = icon('Inbox');
