function buildOutfitPlaceholderMesh(_0x1a1b13,_0x2ea528){const _0x4a2310=new THREE['Group']();_0x4a2310['name']='outfitPlaceholder';const _0x518fbd=new THREE['Color'](_0x1a1b13['colorHex']||'#888888'),_0x17f6eb=new THREE['MeshStandardMaterial']({'color':_0x518fbd,'roughness':0.75}),_0x5ab207=_0x518fbd['clone']()['multiplyScalar'](0.55),_0x355f12=new THREE['MeshStandardMaterial']({'color':_0x5ab207,'roughness':0.75}),_0x331c39=new THREE['MeshStandardMaterial']({'color':new THREE['Color']('#241E1A'),'roughness':0.6}),_0x2bfb69=0.5*_0x2ea528,_0x4f6b70=0.92*_0x2ea528,_0x50ddcb=1.15,_0x56bfe1=new THREE['CylinderGeometry'](_0x2bfb69,_0x4f6b70,_0x50ddcb,0x18),_0x3b9958=new THREE['Mesh'](_0x56bfe1,_0x17f6eb),_0x51ae5d=getNeckBottomY(),_0x544296=_0x51ae5d-_0x50ddcb;_0x3b9958['position']['y']=(_0x51ae5d+_0x544296)/0x2,_0x3b9958['name']='outfitTorsoPlaceholder',_0x4a2310['add'](_0x3b9958);const _0x46fa8d=new THREE['MeshStandardMaterial']({'color':_0x518fbd['clone']()['multiplyScalar'](0.75),'roughness':0.8}),_0x268f6e=new THREE['TorusGeometry'](_0x2bfb69*1.03,0.035*_0x2ea528,0x8,0x14),_0x3b4585=new THREE['Mesh'](_0x268f6e,_0x46fa8d);_0x3b4585['position']['y']=_0x51ae5d,_0x3b4585['rotation']['x']=Math['PI']/0x2,_0x3b4585['name']='outfitCollarPlaceholder',_0x4a2310['add'](_0x3b4585);const _0x2d98bd=_0x4f6b70,_0x52310b=0.72*_0x2ea528,_0x40d029=0.45,_0x1bf00b=new THREE['CylinderGeometry'](_0x2d98bd,_0x52310b,_0x40d029,0x14),_0x2fbeb8=new THREE['Mesh'](_0x1bf00b,_0x355f12),_0x2a9cfe=_0x544296,_0x4737cb=_0x2a9cfe-_0x40d029;_0x2fbeb8['position']['y']=(_0x2a9cfe+_0x4737cb)/0x2,_0x2fbeb8['name']='outfitHipPlaceholder',_0x4a2310['add'](_0x2fbeb8);const _0x308156=0.3*_0x2ea528,_0x12d559=0.19*_0x2ea528,_0x7d25ae=2.35,_0xdf416f=new THREE['CylinderGeometry'](_0x308156,_0x12d559,_0x7d25ae,0x10),_0x1aea23=0.32*_0x2ea528,_0x318dd5=_0x4737cb-_0x7d25ae;[-0x1,0x1]['forEach'](_0x235ae6=>{const _0x22b0fb=new THREE['Mesh'](_0xdf416f,_0x355f12);_0x22b0fb['position']['set'](_0x235ae6*_0x1aea23,(_0x4737cb+_0x318dd5)/0x2,0x0),_0x22b0fb['name']='outfitLegPlaceholder',_0x4a2310['add'](_0x22b0fb);});const _0x2ba3f7=0.24*_0x2ea528,_0x322331=0.16,_0x2a428d=0.46*_0x2ea528,_0x1d6bf0=new THREE['BoxGeometry'](_0x2ba3f7,_0x322331,_0x2a428d);[-0x1,0x1]['forEach'](_0x305711=>{const _0x15f58b=new THREE['Mesh'](_0x1d6bf0,_0x331c39);_0x15f58b['position']['set'](_0x305711*_0x1aea23,_0x318dd5-_0x322331/0x2,_0x2a428d*0.28),_0x15f58b['name']='outfitFootPlaceholder',_0x4a2310['add'](_0x15f58b);});const _0x206f0f=-1.35,_0xf479e3=(_0x206f0f-_0x51ae5d)/-_0x50ddcb,_0x2c4a17=_0x2bfb69+_0xf479e3*(_0x4f6b70-_0x2bfb69),_0x37d889=2.6,_0x5a2dfb=0.15*_0x2ea528,_0x47814f=0.1*_0x2ea528,_0x27d831=new THREE['CylinderGeometry'](_0x5a2dfb,_0x47814f,_0x37d889,0xc);[-0x1,0x1]['forEach'](_0x255c88=>{const _0x573ebd=new THREE['Mesh'](_0x27d831,_0x17f6eb),_0x4a9504=-_0x255c88*2.9,_0x540da5=new THREE['Vector3'](-Math['sin'](_0x4a9504),Math['cos'](_0x4a9504),0x0),_0x4856af=new THREE['Vector3'](_0x255c88*_0x2c4a17*0.92,_0x206f0f,0.02);_0x573ebd['position']['set'](_0x4856af['x']+_0x540da5['x']*_0x37d889*0.5,_0x4856af['y']+_0x540da5['y']*_0x37d889*0.5,_0x4856af['z']+_0x540da5['z']*_0x37d889*0.5),_0x573ebd['rotation']['z']=_0x4a9504,_0x573ebd['name']='outfitArmPlaceholder',_0x4a2310['add'](_0x573ebd);});if(_0x1a1b13['category']==='포멀'){const _0x25324f=new THREE['MeshStandardMaterial']({'color':_0x518fbd['clone']()['multiplyScalar'](0.85),'roughness':0.7}),_0x165181=new THREE['BoxGeometry'](0.16*_0x2ea528,0.55,0.02);[-0x1,0x1]['forEach'](_0x2cfb4a=>{const _0x299c8a=new THREE['Mesh'](_0x165181,_0x25324f);_0x299c8a['position']['set'](_0x2cfb4a*0.14*_0x2ea528,-1.45,_0x2bfb69*0.85),_0x299c8a['rotation']['z']=-_0x2cfb4a*0.28,_0x299c8a['name']='outfitLapelPlaceholder',_0x4a2310['add'](_0x299c8a);});}return _0x4a2310;}function loadOutfitMeshFromOBJ(_0x253222,_0x17d737,_0x4ab5e8,_0x582b8a,_0x32ce2f){return new Promise((_0x109616,_0x1922ed)=>{if(typeof THREE['OBJLoader']!=='function'){_0x1922ed(new Error('OBJLoader\x20스크립트가\x20로드되지\x20않았습니다'));return;}function _0x1a8fcb(_0x4d7533){const _0x3ccd92=new THREE['OBJLoader']();if(_0x4d7533)_0x3ccd92['setMaterials'](_0x4d7533);_0x3ccd92['load'](_0x253222,_0x33f708=>{try{const _0x4f85a0=new THREE['Box3']()['setFromObject'](_0x33f708),_0x39092c=new THREE['Vector3']();_0x4f85a0['getSize'](_0x39092c);const _0x413228=typeof _0x582b8a==='number'?_0x582b8a:0.84,_0x142b33=_0x4f85a0['min']['y']+_0x413228*_0x39092c['y'],_0x452cb6=_0x142b33-_0x4f85a0['min']['y'];let _0x264665=_0x32ce2f;!(isFinite(_0x264665)&&_0x264665>0.5)&&(_0x264665=typeof personBodyLenMesh==='function'?personBodyLenMesh():null);!(isFinite(_0x264665)&&_0x264665>0.5)&&(_0x264665=0x4,console['warn']('[3D·비율]\x20두상\x20자(getPersonScaleRef)가\x20없어\x20폴백\x204.0단위로\x20세웁니다\x20—'+'\x20이\x20경우에만\x20두신이\x20상수에서\x20벗어납니다.'));const _0x2d42c9=isFinite(_0x4ab5e8)&&_0x4ab5e8>0x0?_0x4ab5e8:0x1,_0x1cb814=OUTFIT_MESH_SOURCE['widthMode']||(OUTFIT_MESH_SOURCE['widthUniform']?'uniform':'off'),_0x3a7672=OUTFIT_MESH_SOURCE['scaleOverride']||_0x264665/(_0x452cb6||0x1)*(_0x1cb814==='uniform'?_0x2d42c9:0x1),_0x43d573=_0x1cb814==='xz'?_0x2d42c9:0x1;_0x33f708['scale']['set'](_0x3a7672*_0x43d573,_0x3a7672,_0x3a7672*_0x43d573);if(_0x1cb814!=='off')console['log']('[3D·비율·의상]\x20widthMode='+_0x1cb814+'\x20·\x20폭\x20×'+_0x2d42c9['toFixed'](0x3)+'\x20—\x20off가\x20아니면\x20두신이나\x20몸\x20비례\x20중\x20하나가\x20얼굴\x20폭을\x20따라\x20움직입니다.');const _0x5a347e=new THREE['Box3']()['setFromObject'](_0x33f708),_0x3c88e7=new THREE['Vector3']();_0x5a347e['getCenter'](_0x3c88e7);const _0x23e747=_0x142b33*_0x3a7672,_0x90620d=OUTFIT_MESH_SOURCE['offsetY']||0x0;_0x33f708['position']['x']+=-_0x3c88e7['x'],_0x33f708['position']['z']+=-_0x3c88e7['z'],_0x33f708['position']['y']+=getNeckBottomY()-_0x23e747+_0x90620d,_0x33f708['name']='outfitLoadedOBJ';const _0x251173=['hair'],_0x46309d=new THREE['Plane'](new THREE['Vector3'](0x0,-0x1,0x0),getNeckBottomY());_0x33f708['traverse'](_0x2a224f=>{if(!_0x2a224f['isMesh'])return;const _0x270443=(_0x2a224f['material']&&_0x2a224f['material']['name']||'')['toLowerCase']();if(_0x251173['includes'](_0x270443)){_0x2a224f['visible']=![];return;}const _0x591934=Array['isArray'](_0x2a224f['material'])?_0x2a224f['material']:[_0x2a224f['material']];_0x591934['forEach'](_0x37b368=>{if(!_0x37b368)return;_0x37b368['clippingPlanes']=[_0x46309d],_0x37b368['clipShadows']=!![];if(_0x37b368['color']&&typeof _0x37b368['color']['convertLinearToSRGB']==='function')_0x37b368['color']['convertLinearToSRGB']();});}),_0x109616(_0x33f708);}catch(_0x367414){_0x1922ed(_0x367414);}},undefined,_0x4f199b=>_0x1922ed(_0x4f199b));}if(_0x17d737&&typeof THREE['MTLLoader']==='function'){const _0x630c21=new THREE['MTLLoader']();_0x630c21['load'](_0x17d737,_0x5a8c12=>{_0x5a8c12['preload'](),_0x1a8fcb(_0x5a8c12);},undefined,()=>_0x1a8fcb(null));}else _0x1a8fcb(null);});}async function loadOutfitMesh(_0x2bd81f,_0x2ff056,_0x3dffd5){if(_0x2bd81f['asset']&&_0x2bd81f['asset']['objUrl'])try{return await loadOutfitMeshFromOBJ(_0x2bd81f['asset']['objUrl'],_0x2bd81f['asset']['mtlUrl'],_0x2ff056,_0x2bd81f['asset']['neckCutFrac'],_0x3dffd5);}catch(_0x2d7448){console['warn']('OBJ\x20의상\x20에셋\x20로드\x20실패,\x20절차적\x20플레이스홀더로\x20폴백:',_0x2d7448);}const _0x1539fe=buildOutfitPlaceholderMesh(_0x2bd81f,_0x2ff056);try{const _0xf1707e=isFinite(_0x3dffd5)&&_0x3dffd5>0.5?_0x3dffd5:typeof personBodyLenMesh==='function'?personBodyLenMesh():null,_0x56465a=typeof measureOutfitMeshBody==='function'?measureOutfitMeshBody(_0x1539fe):null;if(_0xf1707e&&_0x56465a&&_0x56465a['heightRaw']>0.01){const _0x246ba3=getNeckBottomY(),_0x41e041=_0xf1707e/_0x56465a['heightRaw'];_0x1539fe['scale']['setScalar'](_0x41e041),_0x1539fe['position']['y']=_0x246ba3*(0x1-_0x41e041);}}catch(_0x335cd1){console['warn']('[3D·비율]\x20플레이스홀더\x20두신\x20배율\x20실패\x20—\x20원래\x20크기\x20유지:',_0x335cd1);}return _0x1539fe;}async function loadOutfitMeshMeasured(_0x7ffe1e,_0x3f6c48,_0x147428){const _0x25fe08=await loadOutfitMesh(_0x7ffe1e,_0x3f6c48,_0x147428);try{const _0x515f08=measureGarmentNeckOpening(_0x25fe08);_0x515f08?(_garmentNeckOpening=_0x515f08,console['log']('[3D·목]\x20옷깃\x20구멍\x20실측\x20반폭\x20'+_0x515f08['halfWidth']['toFixed'](0x3)+'\x20·\x20반깊이\x20'+_0x515f08['halfDepth']['toFixed'](0x3)+'\x20단위\x20→\x20아래\x20링\x20=\x20이\x20값\x20×'+NECK_SHAPE['inset'])):console['warn']('[3D·목]\x20옷깃\x20구멍\x20실측\x20실패\x20—\x20예전(두개골\x20클램프)\x20경로로\x20폴백');}catch(_0x2c2445){console['warn']('[3D·목]\x20옷깃\x20구멍\x20실측\x20예외:',_0x2c2445);}return SHOULDER['_afterOutfitLoad'](_0x25fe08,_0x7ffe1e),_0x25fe08;}var SHOULDER=(function(){'use strict';var _0x2ebf1e=window,_0x41b278='[어깨]',_0x3318d2=Object['assign']({'on':![],'resultOnly':!![],'on_was12m':![],'natural':!![],'on_was':![],'preload':!![],'cell':0.05,'xMax':1.5,'depth':1.9,'margin':0.03,'restMax':0.07,'ambig':0.2,'shoulderRatio':2.1,'earSpanCm':0xf,'frontOnlyIfDraped':!![],'centerBand':0.3,'frontDrape':!![],'mqBack':!![],'sweepLen':0.45,'sweepMinJump':0.08},_0x2ebf1e['SHOULDER']||{}),_0x5ef60c=_0x3318d2['stats']={'strands':0x0,'touched':0x0,'front':0x0,'back':0x0,'rest':0x0,'neck':0x0,'forced':0x0,'swept':0x0,'smooth':0x0,'mq':![],'ms':0x0,'src':'','item':'','err':null},_0x5199df=null,_0x253b55=null,_0x3dcb19=0x1,_0x4c221b=null,_0x286590=null;function _0x39a7c0(){try{return currentScreen;}catch(_0x25077f){return'';}}function _0x565b56(){try{return performance['now']();}catch(_0x1105bd){return Date['now']();}}function _0x574bb6(){try{return modelCmPerUnit()||0x13;}catch(_0x2292a8){return 0x13;}}function _0x151b9c(){try{var _0xc14076=state['shots']&&state['shots']['front'];return _0xc14076?_0xc14076['length']+':'+_0xc14076['slice'](-0x18):'';}catch(_0x3bde64){return'';}}function _0x3cfd1e(_0x1a8c89,_0x257966,_0x1b616b,_0xe7b51c){var _0x3129a9;try{_0x3129a9=getNeckBottomY()+0.02;}catch(_0x20e851){return![];}if(!isFinite(_0x3129a9))return![];var _0x2e0494=_0x3318d2['cell'],_0x184f46=Math['ceil'](_0x3318d2['xMax']/_0x2e0494),_0x4fefcb=Math['ceil'](_0x3318d2['depth']/_0x2e0494),_0xf0a0cb=_0x3129a9-_0x4fefcb*_0x2e0494,_0x7962f4=_0x184f46*_0x2e0494,_0x1bfded=new Float32Array(_0x184f46*_0x4fefcb)['fill'](-Infinity),_0x2fb4df=new Float32Array(_0x184f46*_0x4fefcb)['fill'](Infinity),_0xde8f4a=new Float32Array(_0x184f46)['fill'](-Infinity),_0x5a718a=0x0,_0x1b1026=0x0;try{_0x1a8c89['updateMatrixWorld'](!![]);}catch(_0x709382){}function _0x36c4e8(_0x4f40a2,_0x4781e8,_0x58f770){if(_0x4781e8>_0x3129a9||_0x4781e8<=_0xf0a0cb)return;var _0x4fc54e=_0x4f40a2<0x0?-_0x4f40a2:_0x4f40a2;if(_0x4fc54e>=_0x7962f4)return;var _0x30f71a=_0x4fc54e/_0x2e0494|0x0,_0x5861fc=(_0x3129a9-_0x4781e8)/_0x2e0494|0x0,_0x12ce92=_0x5861fc*_0x184f46+_0x30f71a;if(_0x58f770>_0x1bfded[_0x12ce92])_0x1bfded[_0x12ce92]=_0x58f770;if(_0x58f770<_0x2fb4df[_0x12ce92])_0x2fb4df[_0x12ce92]=_0x58f770;if(_0x4781e8>_0xde8f4a[_0x30f71a])_0xde8f4a[_0x30f71a]=_0x4781e8;}_0x1a8c89['traverse'](function(_0x7d6562){if(!_0x7d6562['isMesh']||_0x7d6562['visible']===![])return;var _0x5727c9=_0x7d6562['geometry'],_0x1d1425=_0x5727c9&&_0x5727c9['attributes']&&_0x5727c9['attributes']['position'];if(!_0x1d1425)return;var _0x37e864=_0x7d6562['matrixWorld']['elements'],_0x14efc5=_0x5727c9['index'],_0x3064b2=_0x14efc5?_0x14efc5['count']:_0x1d1425['count'],_0x466253,_0x483547,_0x360491,_0x50a0b3,_0x82058f=[0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0,0x0];for(_0x466253=0x0;_0x466253+0x2<_0x3064b2;_0x466253+=0x3){for(_0x483547=0x0;_0x483547<0x3;_0x483547++){var _0xcb5cc9=_0x14efc5?_0x14efc5['getX'](_0x466253+_0x483547):_0x466253+_0x483547,_0x2bf183=_0x1d1425['getX'](_0xcb5cc9),_0x2580a8=_0x1d1425['getY'](_0xcb5cc9),_0xea46b8=_0x1d1425['getZ'](_0xcb5cc9);_0x82058f[_0x483547*0x3]=_0x37e864[0x0]*_0x2bf183+_0x37e864[0x4]*_0x2580a8+_0x37e864[0x8]*_0xea46b8+_0x37e864[0xc],_0x82058f[_0x483547*0x3+0x1]=_0x37e864[0x1]*_0x2bf183+_0x37e864[0x5]*_0x2580a8+_0x37e864[0x9]*_0xea46b8+_0x37e864[0xd],_0x82058f[_0x483547*0x3+0x2]=_0x37e864[0x2]*_0x2bf183+_0x37e864[0x6]*_0x2580a8+_0x37e864[0xa]*_0xea46b8+_0x37e864[0xe];}var _0x4e472c=Math['max'](_0x82058f[0x1],_0x82058f[0x4],_0x82058f[0x7]),_0x4d29d7=Math['min'](_0x82058f[0x1],_0x82058f[0x4],_0x82058f[0x7]);if(_0x4d29d7>_0x3129a9||_0x4e472c<_0xf0a0cb)continue;if(Math['min'](Math['abs'](_0x82058f[0x0]),Math['abs'](_0x82058f[0x3]),Math['abs'](_0x82058f[0x6]))>=_0x7962f4&&_0x82058f[0x0]>0x0===_0x82058f[0x3]>0x0&&_0x82058f[0x3]>0x0===_0x82058f[0x6]>0x0)continue;var _0x35a14a=Math['hypot'](_0x82058f[0x3]-_0x82058f[0x0],_0x82058f[0x4]-_0x82058f[0x1],_0x82058f[0x5]-_0x82058f[0x2]),_0x145981=Math['hypot'](_0x82058f[0x6]-_0x82058f[0x0],_0x82058f[0x7]-_0x82058f[0x1],_0x82058f[0x8]-_0x82058f[0x2]),_0x3546b4=Math['hypot'](_0x82058f[0x6]-_0x82058f[0x3],_0x82058f[0x7]-_0x82058f[0x4],_0x82058f[0x8]-_0x82058f[0x5]),_0x518e5b=Math['max'](0x1,Math['min'](0x28,Math['ceil'](Math['max'](_0x35a14a,_0x145981,_0x3546b4)/(_0x2e0494*0.5))));for(_0x360491=0x0;_0x360491<=_0x518e5b;_0x360491++)for(_0x50a0b3=0x0;_0x50a0b3<=_0x518e5b-_0x360491;_0x50a0b3++){var _0x57366a=_0x360491/_0x518e5b,_0x47e40e=_0x50a0b3/_0x518e5b,_0x217311=0x1-_0x57366a-_0x47e40e;_0x36c4e8(_0x82058f[0x0]*_0x217311+_0x82058f[0x3]*_0x57366a+_0x82058f[0x6]*_0x47e40e,_0x82058f[0x1]*_0x217311+_0x82058f[0x4]*_0x57366a+_0x82058f[0x7]*_0x47e40e,_0x82058f[0x2]*_0x217311+_0x82058f[0x5]*_0x57366a+_0x82058f[0x8]*_0x47e40e);}_0x5a718a++;}});for(var _0x4f84a9=0x0;_0x4f84a9<_0x1bfded['length'];_0x4f84a9++)if(_0x1bfded[_0x4f84a9]>-Infinity)_0x1b1026++;if(_0x1b1026<0x3c||!(_0xde8f4a[0x0]>-Infinity))return _0x5ef60c['err']='몸통\x20메쉬에서\x20어깨를\x20못\x20읽음(칸\x20'+_0x1b1026+')',![];var _0x25f270=0x0,_0x4d42e3=0x0,_0x1324a1;for(_0x1324a1=0x0;_0x1324a1<_0x184f46;_0x1324a1++)if(_0xde8f4a[_0x1324a1]>_0x3129a9-0.9)_0x25f270=_0x1324a1;return _0x4d42e3=_0x3129a9-_0xde8f4a[_0x25f270],_0x5199df={'yTop':_0x3129a9,'yBot':_0xf0a0cb,'cell':_0x2e0494,'NX':_0x184f46,'NY':_0x4fefcb,'xMax':_0x7962f4,'ZF':_0x1bfded,'ZB':_0x2fb4df,'TOP':_0xde8f4a,'tris':_0x5a718a,'filled':_0x1b1026,'halfW':(_0x25f270+0x1)*_0x2e0494,'drop':_0x4d42e3},_0x253b55=_0x257966,_0x3dcb19++,_0x5ef60c['src']=_0x1b616b||'',_0x5ef60c['item']=_0xe7b51c||'',_0x5ef60c['err']=null,_0x23ebbe=null,console['log'](_0x41b278+'\x20몸통\x20메쉬에서\x20어깨를\x20읽음('+_0x5ef60c['src']+(_0x5ef60c['item']?'\x20·\x20'+_0x5ef60c['item']:'')+')\x20—\x20삼각형\x20'+_0x5a718a+'개\x20·\x20칸\x20'+_0x1b1026+'\x20·\x20어깨\x20끝(팔\x20바깥)까지\x20반폭\x20'+(_0x5199df['halfW']*_0x574bb6())['toFixed'](0x1)+'cm\x20·\x20거기서\x20윗면이\x20목\x20밑동보다\x20'+(_0x4d42e3*_0x574bb6())['toFixed'](0x1)+'cm\x20낮음'),!![];}_0x3318d2['_measure']=_0x3cfd1e,_0x3318d2['ensure']=function(){if(!_0x3318d2['on']||!_0x3318d2['preload']||_0x3318d2['resultOnly'])return Promise['resolve'](![]);var _0x17db64=_0x151b9c();if(!_0x17db64)return Promise['resolve'](![]);if(_0x5199df&&_0x253b55===_0x17db64)return Promise['resolve'](![]);if(_0x4c221b&&_0x286590===_0x17db64)return _0x4c221b;if(typeof loadOutfitMesh!=='function'||typeof recommendOutfitWithAI!=='function'||typeof THREE==='undefined')return Promise['resolve'](![]);return _0x286590=_0x17db64,_0x4c221b=(async function(){try{if(!(state['landmarks']&&state['landmarks']['front'])||!(state['hairMasks']&&state['hairMasks']['front']))return![];var _0x3a1ddc=await recommendOutfitWithAI();if(!_0x3a1ddc||!_0x3a1ddc['item'])return![];var _0x471b1c=getFaceMetrics(),_0x112099=null,_0x2b595a=null;try{if(isFinite(state['_model3DCrownY']))_0x112099=state['_model3DCrownY'];}catch(_0x4935b4){}try{_0x2b595a=personBodyLenMesh(_0x112099==null?undefined:_0x112099);}catch(_0x475d91){_0x2b595a=null;}if(!(_0x2b595a>0.5))return![];var _0x3b04ff=await loadOutfitMesh(_0x3a1ddc['item'],_0x471b1c['widthFactor'],_0x2b595a);if(_0x151b9c()!==_0x17db64)return![];var _0x1646f0=_0x3cfd1e(_0x3b04ff,_0x17db64,'미리\x20불러옴',_0x3a1ddc['item']['name']||_0x3a1ddc['item']['id']||'');try{if(typeof disposeObject3D==='function')disposeObject3D(_0x3b04ff);}catch(_0x4f0a34){}return _0x1646f0;}catch(_0x5d64bd){return _0x5ef60c['err']=String(_0x5d64bd&&_0x5d64bd['message']||_0x5d64bd),console['warn'](_0x41b278+'\x20미리\x20재기\x20실패',_0x5d64bd),![];}finally{_0x4c221b=null;}}()),_0x4c221b;},_0x3318d2['_afterOutfitLoad']=function(_0x4a690b,_0x40091f){try{var _0x54d5b1=_0x151b9c();if(_0x3318d2['on']&&_0x4a690b&&!(_0x5199df&&_0x253b55===_0x54d5b1)){_0x3cfd1e(_0x4a690b,_0x54d5b1,'3D\x20결과\x20화면에서',_0x40091f&&(_0x40091f['name']||_0x40091f['id'])||'');if(_0x3318d2['resultOnly']&&_0x5199df)try{_0x3318d2['refresh']();}catch(_0x18f306){}}}catch(_0x35979b){console['warn'](_0x41b278+'\x20재기\x20실패',_0x35979b);}};var _0x23ebbe=null;function _0x37b0ab(_0x44025c,_0x2f8e1a,_0x975d92,_0x34829f){var _0x4f3434=_0x34829f,_0x2600bb=_0x34829f,_0xd326ca=_0x975d92*_0x2f8e1a;if(!_0x44025c[_0xd326ca+_0x34829f])return null;while(_0x4f3434>0x0&&_0x44025c[_0xd326ca+_0x4f3434-0x1])_0x4f3434--;while(_0x2600bb<_0x2f8e1a-0x1&&_0x44025c[_0xd326ca+_0x2600bb+0x1])_0x2600bb++;return[_0x4f3434,_0x2600bb];}function _0x163549(){var _0x56d8b7=_0x151b9c();if(_0x23ebbe&&_0x23ebbe['key']===_0x56d8b7)return _0x23ebbe;var _0x54c094={'key':_0x56d8b7,'front':null,'back':null,'signX':0x1};try{var _0x1aa4b9=state['hairMasks']&&state['hairMasks']['front'],_0x2a9c32=state['landmarks']&&state['landmarks']['front'];if(_0x1aa4b9&&_0x2a9c32&&_0x1aa4b9['reasonMask']&&_0x1aa4b9['personMask']&&_0x1aa4b9['maskW']&&_0x1aa4b9['maskH']&&_0x2a9c32['chinY']!=null){var _0x4e2cea=_0x1aa4b9['maskW'],_0x242321=_0x1aa4b9['maskH'],_0x16b79e=_0x1aa4b9['reasonMask'],_0x56bde6=_0x1aa4b9['personMask'],_0x496794=Math['abs'](_0x2a9c32['rEarX']-_0x2a9c32['lEarX'])*_0x4e2cea,_0x1c9d82=Math['round']((_0x2a9c32['lEarX']+_0x2a9c32['rEarX'])/0x2*_0x4e2cea),_0x36bb21=Math['round'](_0x2a9c32['chinY']*_0x242321);if(_0x496794>0x4&&_0x1c9d82>0x0&&_0x1c9d82<_0x4e2cea-0x1){var _0x483733=_0x3318d2['earSpanCm']/_0x496794,_0x5e1131,_0x4913d5=-0x1,_0x46a5f6='사람\x20폭';for(_0x5e1131=_0x36bb21+Math['round'](_0x496794*0.15);_0x5e1131<_0x242321;_0x5e1131++){var _0x2ef264=_0x37b0ab(_0x56bde6,_0x4e2cea,_0x5e1131,_0x1c9d82);if(_0x2ef264&&_0x2ef264[0x1]-_0x2ef264[0x0]+0x1>=_0x3318d2['shoulderRatio']*_0x496794){_0x4913d5=_0x5e1131;break;}}_0x4913d5<0x0&&(_0x4913d5=_0x36bb21+Math['round'](_0x496794*0.75),_0x46a5f6='어림(턱\x20아래\x20'+(0.75*_0x3318d2['earSpanCm'])['toFixed'](0x0)+'cm)');var _0x20c2b2={'shRow':_0x4913d5,'how':_0x46a5f6,'inFrame':_0x4913d5<_0x242321-0x2,'L':{'low':-0x1,'area':0x0},'R':{'low':-0x1,'area':0x0},'cmPx':_0x483733};for(_0x5e1131=Math['max'](0x0,_0x4913d5);_0x5e1131<_0x242321;_0x5e1131++){var _0x45f656=0x0,_0x4320d9=0x0,_0x261984=_0x5e1131*_0x4e2cea,_0x22a611;for(_0x22a611=0x0;_0x22a611<_0x4e2cea;_0x22a611++)if(_0x16b79e[_0x261984+_0x22a611]===0x1){if(_0x22a611<_0x1c9d82)_0x45f656++;else _0x4320d9++;}_0x20c2b2['L']['area']+=_0x45f656,_0x20c2b2['R']['area']+=_0x4320d9;if(_0x45f656>=0x3)_0x20c2b2['L']['low']=_0x5e1131;if(_0x4320d9>=0x3)_0x20c2b2['R']['low']=_0x5e1131;}['L','R']['forEach'](function(_0x248b15){var _0x5dc85d=_0x20c2b2[_0x248b15];_0x5dc85d['depthCm']=_0x5dc85d['low']>=0x0?(_0x5dc85d['low']-_0x4913d5)*_0x483733:0x0,_0x5dc85d['areaCm2']=_0x5dc85d['area']*_0x483733*_0x483733,_0x5dc85d['draped']=_0x20c2b2['inFrame']&&_0x5dc85d['depthCm']>=0x3&&_0x5dc85d['areaCm2']>=0x6;}),_0x54c094['front']=_0x20c2b2;}}}catch(_0x42de3f){_0x54c094['err']=String(_0x42de3f&&_0x42de3f['message']||_0x42de3f);}try{var _0x4b899d=state['hairMasks']&&state['hairMasks']['back'],_0x214a74=state['poseEars']&&state['poseEars']['back'];if(_0x4b899d&&_0x4b899d['reasonMask']&&_0x4b899d['maskW']&&_0x214a74&&_0x214a74['shoulderY']!=null&&_0x214a74['span']>0x0){var _0xfaded5=_0x4b899d['maskW'],_0x463327=_0x4b899d['maskH'],_0x5d06b4=_0x4b899d['reasonMask'],_0x410f29=Math['round'](_0x214a74['shoulderY']*_0x463327),_0x19041a=-0x1,_0x471bf7,_0x306981,_0x3fd8fb;for(_0x471bf7=Math['max'](0x0,_0x410f29);_0x471bf7<_0x463327;_0x471bf7++){_0x3fd8fb=0x0;for(_0x306981=0x0;_0x306981<_0xfaded5;_0x306981++)if(_0x5d06b4[_0x471bf7*_0xfaded5+_0x306981]===0x1)_0x3fd8fb++;if(_0x3fd8fb>=0x3)_0x19041a=_0x471bf7;}_0x54c094['back']={'shRow':_0x410f29,'depthCm':_0x19041a>=0x0?(_0x19041a-_0x410f29)*(_0x3318d2['earSpanCm']/(_0x214a74['span']*_0xfaded5)):0x0};}}catch(_0x17203d){}try{var _0x582efa=state['_hair3Dneutral'],_0xf4f508=_0x582efa&&_0x582efa['occ']&&_0x582efa['occ']['probe']||state['hairOcc3D']&&state['hairOcc3D']['probe'],_0x3168d9=_0xf4f508&&_0xf4f508['cams']&&_0xf4f508['cams']['filter'](function(_0x298fbe){return _0x298fbe['angle']==='front';})[0x0];if(_0x3168d9&&_0x3168d9['R']&&_0x3168d9['s'])_0x54c094['signX']=_0x3168d9['R'][0x0]/_0x3168d9['s']>=0x0?0x1:-0x1;}catch(_0xa1fa61){}return _0x23ebbe=_0x54c094,_0x54c094;}_0x3318d2['recognize']=_0x163549;function _0x23709b(_0x486d63){var _0x3ef629=_0x163549();if(!_0x3ef629['front'])return![];var _0x56457c=_0x486d63>=0x0===_0x3ef629['signX']>0x0;return!!(_0x56457c?_0x3ef629['front']['R']['draped']:_0x3ef629['front']['L']['draped']);}function _0x18d5a0(_0x3af8c9,_0x59906f,_0x26cdc1){var _0x508993=_0x5199df;if(_0x3318d2['natural']){if(_0x3af8c9['y']>_0x508993['yTop']){var _0x206bb2=_0x2ebf1e['REGROW']&&_0x2ebf1e['REGROW']['neckPush'];if(_0x206bb2){var _0x1766c6=_0x206bb2(_0x3af8c9);if(_0x1766c6!==_0x3af8c9)return _0x5ef60c['neck']++,_0x1766c6;}return _0x3af8c9;}if(_0x3af8c9['y']<=_0x508993['yBot'])return _0x3af8c9;var _0x254226=_0x3af8c9['x']<0x0?-_0x3af8c9['x']:_0x3af8c9['x'];if(_0x254226>=_0x508993['xMax'])return _0x3af8c9;var _0x32ef75=_0x254226/_0x508993['cell']|0x0,_0x510786=((_0x508993['yTop']-_0x3af8c9['y'])/_0x508993['cell']|0x0)*_0x508993['NX']+_0x32ef75,_0x35c0a7=_0x508993['ZF'][_0x510786];if(_0x35c0a7===-Infinity)return _0x3af8c9;var _0x1892b7=_0x508993['ZB'][_0x510786],_0x28ae40=_0x3318d2['margin'];if(!(_0x3af8c9['z']>_0x1892b7-_0x28ae40&&_0x3af8c9['z']<_0x35c0a7+_0x28ae40))return _0x3af8c9;if(!_0x26cdc1['pref']){var _0xc7220b=_0x59906f?_0x59906f['z']:_0x3af8c9['z'];_0x26cdc1['pref']=_0xc7220b>=_0x35c0a7-_0x28ae40?'front':'back',_0x5ef60c['touched']++;if(_0x26cdc1['pref']==='front')_0x5ef60c['front']++;else _0x5ef60c['back']++;}var _0x2e35a7=_0x508993['TOP'][_0x32ef75]+_0x28ae40-_0x3af8c9['y'],_0x3e1b59=_0x26cdc1['pref']==='front'?_0x35c0a7+_0x28ae40-_0x3af8c9['z']:_0x3af8c9['z']-(_0x1892b7-_0x28ae40);if(_0x2e35a7>=0x0&&_0x2e35a7<_0x3318d2['restMax']&&_0x2e35a7<_0x3e1b59)return _0x5ef60c['rest']++,{'x':_0x3af8c9['x'],'y':_0x508993['TOP'][_0x32ef75]+_0x28ae40,'z':_0x3af8c9['z']};return{'x':_0x3af8c9['x'],'y':_0x3af8c9['y'],'z':_0x26cdc1['pref']==='front'?_0x35c0a7+_0x28ae40:_0x1892b7-_0x28ae40};}if(_0x3af8c9['y']>_0x508993['yTop']){var _0x5a2ddf=_0x2ebf1e['REGROW']&&_0x2ebf1e['REGROW']['neckPush'];if(_0x5a2ddf){var _0xfa298=_0x5a2ddf(_0x3af8c9);if(_0xfa298!==_0x3af8c9)return _0x5ef60c['neck']++,_0xfa298;}return _0x3af8c9;}if(_0x3af8c9['y']<=_0x508993['yBot'])return _0x3af8c9;var _0x2f2c02=_0x3af8c9['x']<0x0?-_0x3af8c9['x']:_0x3af8c9['x'];if(_0x2f2c02>=_0x508993['xMax'])return _0x3af8c9;var _0x404b5a=_0x2f2c02/_0x508993['cell']|0x0,_0x52d8ac=(_0x508993['yTop']-_0x3af8c9['y'])/_0x508993['cell']|0x0,_0x2d5b70=_0x52d8ac*_0x508993['NX']+_0x404b5a,_0x1a3432=_0x508993['ZF'][_0x2d5b70];if(_0x1a3432===-Infinity)return _0x3af8c9;var _0x333fd5=_0x508993['ZB'][_0x2d5b70],_0x567e56=_0x3318d2['margin'],_0x357c20=_0x3318d2['frontOnlyIfDraped']&&_0x2f2c02>=_0x3318d2['centerBand'],_0x195626=_0x3318d2['frontDrape']&&!_0x26cdc1['mq'];if(_0x357c20&&_0x195626&&_0x26cdc1['drp']==null)_0x26cdc1['drp']=_0x23709b(_0x3af8c9['x']);var _0x1ba59b=_0x357c20&&(!_0x195626||!_0x26cdc1['drp']);if(!(_0x3af8c9['z']>_0x333fd5-_0x567e56&&_0x3af8c9['z']<_0x1a3432+_0x567e56)){if(_0x1ba59b&&_0x3af8c9['z']>=_0x1a3432+_0x567e56&&_0x3af8c9['y']<_0x508993['TOP'][_0x404b5a]){!_0x26cdc1['pref']&&(_0x26cdc1['pref']='back',_0x5ef60c['touched']++,_0x5ef60c['back']++,_0x5ef60c['forced']++);if(_0x26cdc1['pref']==='back')return _0x5ef60c['swept']++,{'x':_0x3af8c9['x'],'y':_0x3af8c9['y'],'z':_0x333fd5-_0x567e56};}return _0x3af8c9;}if(!_0x26cdc1['pref']){var _0x22b2aa=(_0x1a3432+_0x333fd5)/0x2,_0xebceca=_0x59906f?_0x59906f['z']:_0x3af8c9['z'];if(_0x1ba59b){_0x26cdc1['pref']='back';if(_0xebceca>_0x22b2aa)_0x5ef60c['forced']++;}else{if(Math['abs'](_0xebceca-_0x22b2aa)<_0x3318d2['ambig'])_0x26cdc1['pref']=_0x195626&&_0x23709b(_0x3af8c9['x'])?'front':'back';else _0x26cdc1['pref']=_0xebceca>_0x22b2aa?'front':'back';}_0x5ef60c['touched']++;if(_0x26cdc1['pref']==='front')_0x5ef60c['front']++;else _0x5ef60c['back']++;}var _0x55f9a9=_0x508993['TOP'][_0x404b5a]+_0x567e56-_0x3af8c9['y'],_0x5a382a=_0x26cdc1['pref']==='front'?_0x1a3432+_0x567e56-_0x3af8c9['z']:_0x3af8c9['z']-(_0x333fd5-_0x567e56);if(_0x55f9a9>=0x0&&_0x55f9a9<_0x3318d2['restMax']&&_0x55f9a9<_0x5a382a)return _0x5ef60c['rest']++,{'x':_0x3af8c9['x'],'y':_0x508993['TOP'][_0x404b5a]+_0x567e56,'z':_0x3af8c9['z']};return{'x':_0x3af8c9['x'],'y':_0x3af8c9['y'],'z':_0x26cdc1['pref']==='front'?_0x1a3432+_0x567e56:_0x333fd5-_0x567e56};}function _0x462aed(_0x54cff4,_0x5ef2be,_0x2f0127){var _0x4c2a53=_0x3318d2['sweepLen'];if(!(_0x4c2a53>0x0)||_0x2f0127<0x2)return![];var _0x37cea1=_0x54cff4[_0x2f0127]['z'],_0x3aeb4d=0x0,_0x44a9a9,_0x5279d9,_0x5b281c,_0x5b6126,_0x5e4c04,_0x2d2721,_0x2487da,_0x421512=![],_0x692b6=_0x2ebf1e['REGROW']&&_0x2ebf1e['REGROW']['neckPush'];for(_0x44a9a9=_0x2f0127-0x1;_0x44a9a9>=0x1;_0x44a9a9--){_0x3aeb4d+=Math['hypot'](_0x5ef2be[_0x44a9a9]['x']-_0x5ef2be[_0x44a9a9+0x1]['x'],_0x5ef2be[_0x44a9a9]['y']-_0x5ef2be[_0x44a9a9+0x1]['y'],_0x5ef2be[_0x44a9a9]['z']-_0x5ef2be[_0x44a9a9+0x1]['z']);if(_0x3aeb4d>=_0x4c2a53)break;_0x5279d9=_0x54cff4[_0x44a9a9],_0x5b6126=0x1-_0x3aeb4d/_0x4c2a53,_0x5e4c04=_0x5b6126*_0x5b6126*(0x3-0x2*_0x5b6126),_0x2487da=_0x5279d9['z']+(_0x37cea1-_0x5279d9['z'])*_0x5e4c04;if(!(_0x2487da<_0x5279d9['z']-0.0001))continue;_0x2d2721={'x':_0x5279d9['x'],'y':_0x5279d9['y'],'z':_0x2487da};if(_0x692b6&&_0x2d2721['y']>_0x5199df['yTop'])try{_0x2d2721=_0x692b6(_0x2d2721)||_0x2d2721;}catch(_0x51b680){}_0x54cff4[_0x44a9a9]=_0x2d2721,_0x421512=!![];}return _0x421512;}var _0x56b57b=new WeakMap();function _0x1f29d7(_0x20f9e9){if(!_0x3318d2['on']||!_0x5199df||!_0x20f9e9||!_0x20f9e9['length'])return _0x20f9e9;if(_0x3318d2['resultOnly']&&_0x39a7c0()==='adjust')return _0x20f9e9;var _0x42c3d0=_0x56b57b['get'](_0x20f9e9);if(_0x42c3d0&&_0x42c3d0['ver']===_0x3dcb19)return _0x42c3d0['out'];var _0x1cf414=_0x565b56(),_0x1d9880=_0x20f9e9['length'],_0x279308=new Array(_0x1d9880),_0x5d0cd8,_0x164e26,_0x396ef0,_0x2b136c,_0x2e9cfc,_0x365bd8,_0x3e30e5,_0x4fee74=_0x5199df['yTop']+0.6;_0x5ef60c['strands']=_0x1d9880,_0x5ef60c['touched']=_0x5ef60c['front']=_0x5ef60c['back']=_0x5ef60c['rest']=_0x5ef60c['neck']=_0x5ef60c['forced']=_0x5ef60c['swept']=_0x5ef60c['smooth']=0x0;var _0x30ad69=![];try{_0x30ad69=!!(_0x3318d2['mqBack']&&MANNEQUIN['on']);}catch(_0x296d55){_0x30ad69=![];}_0x5ef60c['mq']=_0x30ad69;for(_0x5d0cd8=0x0;_0x5d0cd8<_0x1d9880;_0x5d0cd8++){_0x396ef0=_0x20f9e9[_0x5d0cd8],_0x2b136c=_0x396ef0&&_0x396ef0['pts'],_0x2e9cfc=null;if(_0x2b136c&&_0x2b136c['length']>0x1){_0x365bd8={'pref':null,'drp':null,'mq':_0x30ad69,'k0':-0x1};for(_0x164e26=0x1;_0x164e26<_0x2b136c['length'];_0x164e26++){if(!(_0x2b136c[_0x164e26]['y']<_0x4fee74))continue;_0x3e30e5=_0x18d5a0(_0x2b136c[_0x164e26],_0x2e9cfc?_0x2e9cfc[_0x164e26-0x1]:_0x2b136c[_0x164e26-0x1],_0x365bd8);if(_0x3e30e5!==_0x2b136c[_0x164e26]){if(!_0x2e9cfc){_0x2e9cfc=_0x2b136c['slice']();try{_0x2e9cfc['_pre']=_0x2b136c['_pre']||_0x2b136c;}catch(_0x10c675){}}_0x2e9cfc[_0x164e26]=_0x3e30e5;if(_0x365bd8['k0']<0x0&&_0x365bd8['pref']==='back'&&_0x3e30e5['z']<_0x2b136c[_0x164e26]['z']-_0x3318d2['sweepMinJump'])_0x365bd8['k0']=_0x164e26;}}if(_0x2e9cfc&&_0x365bd8['k0']>0x0&&_0x462aed(_0x2e9cfc,_0x2b136c,_0x365bd8['k0']))_0x5ef60c['smooth']++;}_0x279308[_0x5d0cd8]=_0x2e9cfc?Object['assign']({},_0x396ef0,{'pts':_0x2e9cfc}):_0x396ef0;}return _0x5ef60c['ms']=_0x565b56()-_0x1cf414,_0x56b57b['set'](_0x20f9e9,{'ver':_0x3dcb19,'out':_0x279308}),_0x279308;}_0x3318d2['_pass']=_0x1f29d7,_0x3318d2['_apply']=function(_0x17fb81){try{return _0x1f29d7(_0x17fb81);}catch(_0x3ce2cc){return _0x5ef60c['err']=String(_0x3ce2cc&&_0x3ce2cc['message']||_0x3ce2cc),_0x17fb81;}},_0x3318d2['_sigTail']=function(){return'|sh'+(_0x3318d2['on']&&_0x5199df&&!(_0x3318d2['resultOnly']&&_0x39a7c0()==='adjust')?_0x3dcb19+(_0x3318d2['natural']?'n':''):0x0);};function _0x226388(){try{if(typeof ADJ_CACHE!=='undefined'&&ADJ_CACHE['bump'])ADJ_CACHE['bump']();}catch(_0x2ef565){}try{if(_0x39a7c0()==='adjust'&&typeof renderAdjustFrame==='function')renderAdjustFrame();}catch(_0x18fd02){}}return _0x3318d2['refresh']=function(){return _0x3dcb19++,_0x56b57b=new WeakMap(),_0x23ebbe=null,_0x226388(),_0x3318d2['on'];},_0x3318d2['reset']=function(){_0x5199df=null,_0x253b55=null,_0x23ebbe=null,_0x3dcb19++;},_0x3318d2['_afterNav']=function(_0x1eb0b8){try{if(_0x1eb0b8==='style'||_0x1eb0b8==='adjust')_0x3318d2['ensure']()['then'](function(_0x3458ac){if(_0x3458ac)_0x226388();});}catch(_0x519e0b){}},_0x3318d2['_panelLines']=function(){var _0x5a46e5=[],_0x4e8b16=_0x574bb6(),_0x1a1808;if(!_0x3318d2['on'])return _0x5a46e5['concat']([_0x41b278+'\x20꺼짐']);_0x1a1808=_0x41b278+'\x20켜짐\x20·\x20'+(_0x5199df?'몸통\x20메쉬에서\x20읽음('+_0x5ef60c['src']+(_0x5ef60c['item']?'\x20·\x20'+_0x5ef60c['item']:'')+')\x20—\x20어깨\x20끝(팔\x20바깥)까지\x20반폭\x20'+(_0x5199df['halfW']*_0x4e8b16)['toFixed'](0x1)+'cm\x20·\x20거기서\x20윗면이\x20목\x20밑동보다\x20'+(_0x5199df['drop']*_0x4e8b16)['toFixed'](0x1)+'cm\x20낮음\x20·\x20칸\x20'+_0x5199df['filled']:'아직\x20못\x20읽음(몸통\x20메쉬를\x20불러오기\x20전)'+(_0x4c221b?'\x20·\x20불러오는\x20중':''))+(_0x5ef60c['err']?'\x20·\x20⚠\x20'+_0x5ef60c['err']:''),_0x5a46e5=_0x5a46e5['concat']([_0x1a1808]);if(_0x5199df)_0x5a46e5['push']('\x20\x20적용(직전)\x20—\x20가닥\x20'+_0x5ef60c['strands']+'개\x20중\x20몸통에\x20닿은\x20가닥\x20'+_0x5ef60c['touched']+'\x20(앞으로\x20'+_0x5ef60c['front']+'\x20/\x20뒤로\x20'+_0x5ef60c['back']+')\x20·\x20어깨\x20위에\x20얹은\x20점\x20'+_0x5ef60c['rest']+'\x20·\x20목\x20밖으로\x20민\x20점\x20'+_0x5ef60c['neck']+'\x20·\x20'+Math['round'](_0x5ef60c['ms'])+'ms'+(!_0x3318d2['frontDrape']?'\x20·\x20어깨\x20앞으로\x20넘기기\x20꺼짐\x20—\x20전부\x20등\x20쪽으로:\x20앞에\x20있었지만\x20뒤로\x20보낸\x20가닥\x20'+_0x5ef60c['forced']+'\x20(어깨\x20앞에\x20떠\x20있던\x20점\x20'+_0x5ef60c['swept']+')':_0x3318d2['frontOnlyIfDraped']?'\x20·\x20앞은\x20사진에서\x20넘긴\x20쪽만:\x20앞에\x20있었지만\x20뒤로\x20보낸\x20가닥\x20'+_0x5ef60c['forced']+'\x20(어깨\x20앞에\x20떠\x20있던\x20점\x20'+_0x5ef60c['swept']+')'+(_0x5ef60c['mq']?'\x20·\x20마네킹:\x20전부\x20등\x20쪽으로':''):'\x20·\x20앞은\x20사진에서\x20넘긴\x20쪽만:\x20꺼짐')+'\x20·\x20넘어가는\x20자리\x20다듬은\x20가닥\x20'+_0x5ef60c['smooth']);if(!_0x3318d2['frontDrape'])return _0x5a46e5;try{var _0x5b9ec2=_0x163549(),_0x7321e=_0x5b9ec2['front'];if(_0x7321e){var _0x3f2d92=function(_0x5b7398){return'어깨선\x20아래\x20'+_0x5b7398['depthCm']['toFixed'](0x1)+'cm\x20·\x20'+_0x5b7398['areaCm2']['toFixed'](0x0)+'cm²\x20→\x20'+(_0x5b7398['draped']?'앞으로\x20넘김':'안\x20넘김');};_0x5a46e5['push']('\x20\x20사진\x20인지(정면)\x20—\x20어깨선:\x20사진\x20높이의\x20'+Math['round'](_0x7321e['shRow']/(state['hairMasks']['front']['maskH']||0x1)*0x64)+'%\x20줄('+_0x7321e['how']+')'+(_0x7321e['inFrame']?'':'\x20⚠\x20어깨가\x20사진\x20밖\x20—\x20판정\x20안\x20함')+'\x20·\x20화면\x20왼쪽:\x20'+_0x3f2d92(_0x7321e['L'])+'\x20·\x20화면\x20오른쪽:\x20'+_0x3f2d92(_0x7321e['R']));}else _0x5a46e5['push']('\x20\x20사진\x20인지(정면)\x20—\x20못\x20함(정면\x20머리\x20영역/랜드마크\x20없음)'+(_0x5b9ec2['err']?'\x20⚠\x20'+_0x5b9ec2['err']:''));_0x5a46e5['push']('\x20\x20사진\x20인지(후면)\x20—\x20'+(_0x5b9ec2['back']?'어깨\x20아래로\x20'+_0x5b9ec2['back']['depthCm']['toFixed'](0x1)+'cm\x20내려온\x20머리(등\x20쪽)':'어깨\x20높이를\x20못\x20잡음(포즈\x20없음)'));}catch(_0x5715d5){}return _0x5a46e5;},console['log'](_0x41b278+(_0x3318d2['on']?'\x20설치\x20—\x20몸통\x20메쉬에서\x20어깨를\x20읽어\x20머리카락이\x20몸통을\x20뚫지\x20않게\x20합니다(전부\x20등\x20쪽으로\x20·\x20어깨\x20앞으로\x20넘기기는\x20SHOULDER.frontDrape=true로\x20켬).\x20끄기\x20SHOULDER.on=false\x20후\x20SHOULDER.refresh()':'\x20설치\x20—\x20꺼짐(기본):\x20머리가\x20만들어진\x20그대로\x20내려갑니다(앞·뒤로\x20보내지\x20않음\x20·\x20몸통을\x20통과할\x20수\x20있음).\x20켜기\x20SHOULDER.on=true;\x20SHOULDER.refresh()')),_0x3318d2;}());function refitNeckToGarment(_0x5f0669,_0x5e151c){if(!NECK_SHAPE['fromGarment']||!_garmentNeckOpening||!_0x5f0669)return![];const _0x381b9b=_0x5f0669['getObjectByName']('neckAttachPoint');if(!_0x381b9b)return![];try{let _0x4c9421=new THREE['Color'](_0x5e151c||'#E8C39E');if((_0x4c9421['r']+_0x4c9421['g']+_0x4c9421['b'])/0x3<0.3)_0x4c9421=new THREE['Color']('#E0B294');const _0x3090e9=buildRealNeckMesh(_0x4c9421);if(!_0x3090e9)return![];const _0x500b70=_0x381b9b['parent']||_0x5f0669;return _0x500b70['remove'](_0x381b9b),disposeObject3D(_0x381b9b),_0x500b70['add'](_0x3090e9),!![];}catch(_0x3fc5fc){return console['warn']('[3D·목]\x20옷깃\x20기준\x20재생성\x20실패(예전\x20목\x20유지):',_0x3fc5fc),![];}}function composeRotationZYX(_0x595121,_0x269675,_0x54f79f){const _0x44a44e=Math['cos'](_0x595121),_0x1109f6=Math['sin'](_0x595121),_0x5c34fb=Math['cos'](_0x269675),_0x8fbf96=Math['sin'](_0x269675),_0x528e73=Math['cos'](_0x54f79f),_0x1abbce=Math['sin'](_0x54f79f);function _0x9a77e0(_0x254032,_0x3f6130){const _0x48e86f=new Array(0x9);for(let _0xcf170f=0x0;_0xcf170f<0x3;_0xcf170f++)for(let _0x1bf7ca=0x0;_0x1bf7ca<0x3;_0x1bf7ca++){let _0x189f23=0x0;for(let _0x1fade4=0x0;_0x1fade4<0x3;_0x1fade4++)_0x189f23+=_0x254032[_0xcf170f*0x3+_0x1fade4]*_0x3f6130[_0x1fade4*0x3+_0x1bf7ca];_0x48e86f[_0xcf170f*0x3+_0x1bf7ca]=_0x189f23;}return _0x48e86f;}const _0x2f5b41=[_0x528e73,-_0x1abbce,0x0,_0x1abbce,_0x528e73,0x0,0x0,0x0,0x1],_0x173b3a=[_0x44a44e,0x0,_0x1109f6,0x0,0x1,0x0,-_0x1109f6,0x0,_0x44a44e],_0x39f080=[0x1,0x0,0x0,0x0,_0x5c34fb,-_0x8fbf96,0x0,_0x8fbf96,_0x5c34fb];return _0x9a77e0(_0x9a77e0(_0x2f5b41,_0x173b3a),_0x39f080);}function applyRotationTranspose3(_0x137d9b,_0x19bb32){return new THREE['Vector3'](_0x137d9b[0x0]*_0x19bb32['x']+_0x137d9b[0x3]*_0x19bb32['y']+_0x137d9b[0x6]*_0x19bb32['z'],_0x137d9b[0x1]*_0x19bb32['x']+_0x137d9b[0x4]*_0x19bb32['y']+_0x137d9b[0x7]*_0x19bb32['z'],_0x137d9b[0x2]*_0x19bb32['x']+_0x137d9b[0x5]*_0x19bb32['y']+_0x137d9b[0x8]*_0x19bb32['z']);}let _silhouetteAnchorCache={};function computeSilhouetteAnchors(_0x4b15aa){if(_silhouetteAnchorCache[_0x4b15aa]!==undefined)return _silhouetteAnchorCache[_0x4b15aa];let _0x4f12b0=null;try{const _0x36db41=state['hairMasks']&&state['hairMasks'][_0x4b15aa],_0x301faa=state['landmarks']&&state['landmarks']['front'],_0x5db545=state['hairMasks']&&state['hairMasks']['front'];if(_0x36db41&&_0x36db41['personMask']&&_0x301faa&&_0x5db545&&_0x5db545['personMask']&&_0x5db545['scalpY']){const _0x3fdcdf=(_0x1050aa,_0xe58d21,_0x870d4c)=>{const _0x4f659c=[];for(let _0x4abc8e=Math['floor'](_0xe58d21/0x3);_0x4abc8e<Math['floor'](_0xe58d21*0x2/0x3);_0x4abc8e++){for(let _0x40c624=0x0;_0x40c624<_0x870d4c;_0x40c624++){if(_0x1050aa[_0x40c624*_0xe58d21+_0x4abc8e]){_0x4f659c['push'](_0x40c624);break;}}}if(_0x4f659c['length']<0xa)return-0x1;return _0x4f659c['sort']((_0x79d28b,_0x1ab472)=>_0x79d28b-_0x1ab472),_0x4f659c[Math['floor'](_0x4f659c['length']*0.05)];},_0xd0aace=(_0x366f0b,_0x4c9e59,_0x56bd60)=>{let _0x276d0b=-0x1,_0x578e6b=-0x1;for(let _0x197e5c=0x0;_0x197e5c<_0x4c9e59;_0x197e5c++){if(_0x366f0b[_0x56bd60*_0x4c9e59+_0x197e5c]){_0x276d0b=_0x197e5c;break;}}for(let _0x108f6f=_0x4c9e59-0x1;_0x108f6f>=0x0;_0x108f6f--){if(_0x366f0b[_0x56bd60*_0x4c9e59+_0x108f6f]){_0x578e6b=_0x108f6f;break;}}return _0x276d0b>=0x0&&_0x578e6b>=_0x276d0b?{'l':_0x276d0b,'r':_0x578e6b,'w':_0x578e6b-_0x276d0b+0x1}:null;},_0x2f4da7=(_0x58fa73,_0x4a83ed,_0x11e31d,_0x50ddfe)=>{let _0xaddcf=-0x1,_0x14f1ab=0x0,_0x3f642a=0x0,_0x526d88=0x0,_0x3e1131=-0x1;const _0x2a52bf=[];for(let _0x5cc688=_0x50ddfe;_0x5cc688<_0x11e31d;_0x5cc688++){const _0x9cb809=_0xd0aace(_0x58fa73,_0x4a83ed,_0x5cc688);if(!_0x9cb809)continue;_0x2a52bf['push'](_0x9cb809['w']);if(_0x2a52bf['length']>0x8){const _0x18c5de=_0x2a52bf['slice']()['sort']((_0x3a4d83,_0x3ab161)=>_0x3a4d83-_0x3ab161)[Math['floor'](_0x2a52bf['length']/0x2)];if(_0x9cb809['w']>_0x18c5de*1.6){_0x3e1131=_0x5cc688;break;}}_0x9cb809['w']>_0x526d88&&(_0x526d88=_0x9cb809['w'],_0xaddcf=_0x5cc688,_0x14f1ab=_0x9cb809['l'],_0x3f642a=_0x9cb809['r']);}return _0xaddcf>_0x50ddfe?{'earRow':_0xaddcf,'earL':_0x14f1ab,'earR':_0x3f642a,'span':_0x3f642a-_0x14f1ab,'shoulderRow':_0x3e1131}:null;},_0x163d64=_0x36db41['maskW'],_0x27e8ec=_0x36db41['maskH'],_0x447b48=_0x5db545['maskW'],_0x330dd7=_0x5db545['maskH'],_0x67b09b=_0x3fdcdf(_0x36db41['personMask'],_0x163d64,_0x27e8ec),_0x2bf814=_0x3fdcdf(_0x5db545['personMask'],_0x447b48,_0x330dd7),_0x4986ba=_0x67b09b>=0x0?_0x2f4da7(_0x36db41['personMask'],_0x163d64,_0x27e8ec,_0x67b09b):null,_0x4ff41f=_0x2bf814>=0x0?_0x2f4da7(_0x5db545['personMask'],_0x447b48,_0x330dd7,_0x2bf814):null;let _0x23b7f2=state['poseEars']&&state['poseEars'][_0x4b15aa];if(_0x23b7f2&&_0x4986ba&&_0x4986ba['span']>0x4){const _0x257af6=(_0x23b7f2['rEarX']-_0x23b7f2['lEarX'])*_0x163d64/_0x4986ba['span'],_0xde691a=_0x4ff41f&&_0x4ff41f['span']>0x4?clamp(Math['abs'](_0x301faa['rEarX']-_0x301faa['lEarX'])*_0x447b48/_0x4ff41f['span'],0.4,1.05):0x0,_0x5c522c=_0xde691a?_0xde691a*0.5:0.3,_0x1e6a28=_0xde691a?_0xde691a*1.6:1.4;(_0x257af6<_0x5c522c||_0x257af6>_0x1e6a28)&&(console['log']('['+_0x4b15aa+']\x20포즈\x20귀\x20=\x20실루엣\x20폭의\x20'+(_0x257af6*0x64)['toFixed'](0x0)+'%'+(_0xde691a?'\x20(정면\x20실측\x20기준\x20'+(_0xde691a*0x64)['toFixed'](0x0)+'%,\x20허용\x20'+(_0x5c522c*0x64)['toFixed'](0x0)+'~'+(_0x1e6a28*0x64)['toFixed'](0x0)+'%)':'\x20(허용\x2030~140%)')+'\x20—\x20비정상으로\x20보고\x20실루엣\x20앵커\x20사용'),_0x23b7f2=null);}const _0x216d7e=(_0x462148,_0x254df9,_0xc86888,_0x47b148,_0x257484)=>{const _0x471dbb=[];for(let _0x36703a=_0x47b148;_0x36703a<Math['min'](_0xc86888,_0x47b148+_0x257484);_0x36703a++){const _0x302a7f=_0xd0aace(_0x462148,_0x254df9,_0x36703a);_0x471dbb['push'](_0x302a7f?_0x302a7f['w']/0x2:0x0);}return _0x471dbb;},_0x2e5608=(_0x311ced,_0x5ea8e0)=>{let _0x798c2b=null;for(let _0x39a054=0.55;_0x39a054<=1.85;_0x39a054+=0.004){const _0x1a930a=Math['min'](_0x311ced['length']-0x1,Math['floor']((_0x5ea8e0['length']-0x1)/_0x39a054));if(_0x1a930a<0x18)continue;let _0x1c1b93=0x0,_0x357b08=0x0;for(let _0xd47884=0x0;_0xd47884<=_0x1a930a;_0xd47884++){const _0x10ec77=_0xd47884*_0x39a054,_0x32eb36=Math['floor'](_0x10ec77),_0x257200=_0x10ec77-_0x32eb36,_0x2169d7=_0x32eb36+0x1<_0x5ea8e0['length']?_0x5ea8e0[_0x32eb36]*(0x1-_0x257200)+_0x5ea8e0[_0x32eb36+0x1]*_0x257200:_0x5ea8e0[_0x5ea8e0['length']-0x1];_0x1c1b93+=Math['abs'](_0x2169d7-_0x39a054*_0x311ced[_0xd47884]),_0x357b08+=_0x39a054*_0x311ced[_0xd47884];}const _0x5d0184=_0x1c1b93/Math['max'](0.000001,_0x357b08);if(!_0x798c2b||_0x5d0184<_0x798c2b['err'])_0x798c2b={'s':_0x39a054,'err':_0x5d0184,'n':_0x1a930a+0x1};}return _0x798c2b;},_0x33a9b1=typeof _0x301faa['chinY']==='number'?Math['round'](_0x301faa['chinY']*_0x330dd7-_0x2bf814):0x0,_0x52dd9a=typeof _0x301faa['earY']==='number'?Math['round']((_0x301faa['earY']*_0x330dd7-_0x2bf814)*1.25):0x0;let _0x13bf14=null,_0x4b30a3=null,_0x2d5032=null;if(!_0x23b7f2&&_0x33a9b1>0x18&&_0x2bf814>=0x0&&_0x67b09b>=0x0){const _0x19c5dd=_0x2de1b9=>_0x2de1b9>0x18?_0x2e5608(_0x216d7e(_0x5db545['personMask'],_0x447b48,_0x330dd7,_0x2bf814,_0x2de1b9),_0x216d7e(_0x36db41['personMask'],_0x163d64,_0x27e8ec,_0x67b09b,Math['round'](_0x2de1b9*1.9))):null;_0x4b30a3=_0x19c5dd(_0x33a9b1*0x2),_0x2d5032=_0x19c5dd(_0x52dd9a);const _0x545d23=[_0x4b30a3,_0x2d5032]['filter'](Boolean);_0x545d23['length']&&(_0x13bf14=_0x545d23['reduce']((_0x44a69c,_0xe8f144)=>_0xe8f144['err']<_0x44a69c['err']?_0xe8f144:_0x44a69c),_0x13bf14['which']=_0x13bf14===_0x4b30a3?'옆선\x20전체':'정수리\x20구간');}const _0x25019e=!!_0x13bf14&&typeof _0x301faa['earY']==='number';let _0x538cf5,_0x138bde,_0x50eb09;if(_0x23b7f2)_0x538cf5={'l':_0x23b7f2['lEarX']*_0x163d64,'r':_0x23b7f2['rEarX']*_0x163d64,'row':_0x23b7f2['earY']*_0x27e8ec,'span':(_0x23b7f2['rEarX']-_0x23b7f2['lEarX'])*_0x163d64,'src':'pose'},_0x138bde=Math['abs'](_0x301faa['rEarX']-_0x301faa['lEarX'])*_0x447b48,_0x50eb09='pose';else{if(_0x25019e){const _0x32ac84=_0x13bf14['s'],_0x34a3b5=_0x67b09b+(_0x301faa['earY']*_0x330dd7-_0x2bf814)*_0x32ac84,_0x21e9ac=Math['abs'](_0x301faa['rEarX']-_0x301faa['lEarX'])*_0x447b48*_0x32ac84,_0x2cae9c=_0xd0aace(_0x36db41['personMask'],_0x163d64,Math['max'](0x0,Math['min'](_0x27e8ec-0x1,Math['round'](_0x34a3b5)))),_0xfe2867=_0x2cae9c?(_0x2cae9c['l']+_0x2cae9c['r'])/0x2:_0x163d64/0x2;_0x538cf5={'l':_0xfe2867-_0x21e9ac/0x2,'r':_0xfe2867+_0x21e9ac/0x2,'row':_0x34a3b5,'span':_0x21e9ac,'src':'silhouette-fit'},_0x138bde=Math['abs'](_0x301faa['rEarX']-_0x301faa['lEarX'])*_0x447b48,_0x50eb09='profile';const _0x4b7fa3=_0x13bf14['err']<0.02?'아주\x20잘\x20맞음':_0x13bf14['err']<0.05?'맞음':_0x13bf14['err']<0.1?'⚠\x20헐거움':'⚠⚠\x20앞뒤\x20실루엣이\x20안\x20닮음';console['log']('[앵커·실루엣맞춤]\x20'+_0x4b15aa+':\x20배율\x20×'+_0x32ac84['toFixed'](0x3)+'\x20·\x20잔차\x20'+(_0x13bf14['err']*0x64)['toFixed'](0x1)+'%\x20('+_0x4b7fa3+')'+('\x20·\x20채택\x20'+_0x13bf14['which']+'\x20('+_0x13bf14['n']+'행\x20대조)')+(_0x4b30a3&&_0x2d5032?'\x20·\x20옆선전체\x20×'+_0x4b30a3['s']['toFixed'](0x3)+'/'+(_0x4b30a3['err']*0x64)['toFixed'](0x1)+'%'+('\x20vs\x20정수리\x20×'+_0x2d5032['s']['toFixed'](0x3)+'/'+(_0x2d5032['err']*0x64)['toFixed'](0x1)+'%'):'')+('\x0a\x20\x20\x20\x20귀높이\x20y\x20'+(_0x34a3b5/_0x27e8ec)['toFixed'](0x3)+'\x20(정면\x20실측\x20'+_0x301faa['earY']['toFixed'](0x3)+'를\x20옮김)\x20·\x20귀\x20간격\x20'+(_0x21e9ac/_0x163d64)['toFixed'](0x3))+(_0x4986ba?'\x20·\x20예전\x20최대폭\x20자였다면\x20y\x20'+(_0x4986ba['earRow']/_0x27e8ec)['toFixed'](0x3)+'\x20/\x20간격\x20'+(_0x4986ba['span']/_0x163d64)['toFixed'](0x3):'')+'\x0a\x20\x20\x20\x20잔차\x20기준(하네스\x20실측):\x20실루엣이\x20진짜\x20닮으면\x201%\x20미만으로\x20떨어지고\x20배율\x20오차\x200.2%.\x208%를\x20넘으면\x20앞뒤\x20숱이\x20달라\x20배율을\x20믿을\x20수\x20없습니다.');}else _0x538cf5=_0x4986ba?{'l':_0x4986ba['earL'],'r':_0x4986ba['earR'],'row':_0x4986ba['earRow'],'span':_0x4986ba['span'],'src':'silhouette'}:null,_0x138bde=_0x4ff41f?_0x4ff41f['span']:0x0,_0x50eb09='width',console['warn']('[앵커·실루엣맞춤]\x20'+_0x4b15aa+':\x20옆선\x20대조\x20실패\x20—\x20예전\x20최대폭\x20자로\x20폴백'+(headRows>0x18?'':'\x20·\x20정면\x20턱\x20랜드마크가\x20없어\x20비교\x20구간을\x20못\x20정함')+(typeof _0x301faa['earY']==='number'?'':'\x20·\x20정면\x20귀높이\x20랜드마크\x20없음'));}if(_0x538cf5&&_0x538cf5['span']>0x4&&_0x138bde>0x4&&_0x67b09b>=0x0&&_0x2bf814>=0x0){const _0x1955f6=(_0x301faa['eyeY']*_0x330dd7-_0x2bf814)/_0x138bde,_0x1d8974=(_0x301faa['chinY']*_0x330dd7-_0x2bf814)/_0x138bde,_0x58ed7e=(_0x67b09b+_0x1955f6*_0x538cf5['span'])/_0x27e8ec,_0x581aa7=(_0x67b09b+_0x1d8974*_0x538cf5['span'])/_0x27e8ec;_0x4f12b0={'eyeY':_0x58ed7e,'chinY':_0x581aa7,'browTopY':Math['max'](0x0,_0x58ed7e-(_0x301faa['eyeY']-_0x301faa['browTopY'])),'earY':_0x538cf5['row']/_0x27e8ec,'foreheadY':Math['max'](0x0,_0x58ed7e-(_0x301faa['eyeY']-_0x301faa['foreheadY'])),'lEarX':_0x538cf5['l']/_0x163d64,'rEarX':_0x538cf5['r']/_0x163d64,'_silhouette':!![],'_anchorSrc':_0x538cf5['src'],'_rowRule':_0x50eb09};}}}catch(_0x220f7e){console['warn']('실루엣\x20앵커\x20계산\x20실패:',_0x4b15aa,_0x220f7e);}return _silhouetteAnchorCache[_0x4b15aa]=_0x4f12b0,_0x4f12b0;}function projectImagePointToHead(_0xf6f618,_0x1ce302,_0x2b8e37,_0x57b6f2,_0x250d05,_0x608ed0){const _0x5b9250=state['landmarks']&&state['landmarks'][_0xf6f618]||computeSilhouetteAnchors(_0xf6f618)||getEstimatedLandmarks(_0xf6f618);if(!_0x5b9250)return null;const _0x13ec2a=_0x57b6f2||0x1,_0x18bb6f=_0x250d05||0x1,_0x175a1a=makeFaceProjector(_0x5b9250,_0x13ec2a,_0x18bb6f),_0x59a266=_0x175a1a['toMeshX'](_0x1ce302),_0x4b759d=_0x175a1a['toMeshY'](_0x2b8e37),{a:_0x4d1275,b:_0x15bb56,c:_0xb9eb12}=getHeadEllipsoid(),_0x132c94=_0x4b759d-0.15,_0xbe0785=_0x59a266/_0x4d1275*(_0x59a266/_0x4d1275)+_0x132c94/_0x15bb56*(_0x132c94/_0x15bb56);let _0x281706;if(_0xbe0785<=0.98)_0x281706=_0xb9eb12*Math['sqrt'](Math['max'](0x0,0x1-_0xbe0785));else{if(_0x608ed0&&typeof _0x608ed0['hangZ']==='number')_0x281706=_0x608ed0['hangZ'];else{if(_0x608ed0&&_0x608ed0['clampRim']&&_0xbe0785<=1.2)_0x281706=0x0;else return null;}}if(_0x608ed0)_0x608ed0['usedZ']=_0x281706;const _0x3af77a=(_0x5b9250['poseYawDeg']??getViewYawDeg(_0xf6f618))*Math['PI']/0xb4,_0x42e5d1=(_0x5b9250['posePitchDeg']??getViewPitchDeg(_0xf6f618))*Math['PI']/0xb4,_0x4bf93d=(_0x5b9250['poseRollDeg']??getViewRollDeg(_0xf6f618))*Math['PI']/0xb4,_0x27f0f1=composeRotationZYX(_0x3af77a,_0x42e5d1,_0x4bf93d),_0x5bfcd9=applyRotationTranspose3(_0x27f0f1,new THREE['Vector3'](_0x59a266,_0x132c94,_0x281706));return _0x5bfcd9['y']+=0.15,_0x5bfcd9;}function buildStrandProjectionEllipsoidDebug(){const _0x540b69=new THREE['Group']();_0x540b69['name']='strandEllipsoidDebug';const _0x577a43=(_0x352e5b,_0x265668,_0x582b91)=>{const _0x157e18=new THREE['Mesh'](new THREE['SphereGeometry'](0x1,0x18,0x10),new THREE['MeshBasicMaterial']({'color':_0x265668,'wireframe':!![],'transparent':!![],'opacity':_0x582b91}));return _0x157e18['scale']['set'](_0x352e5b['a'],_0x352e5b['b'],_0x352e5b['c']),_0x157e18['position']['set'](0x0,0.15,0x0),_0x157e18;};_0x540b69['add'](_0x577a43(getHeadEllipsoid(),0x4fc3f7,0.3));try{_0x540b69['add'](_0x577a43(getScalpEllipsoid(),0x7be38a,0.45));}catch(_0x493a5e){}return _0x540b69;}function toggleStrandDebug(){state['debugShowStrandSurface']=!state['debugShowStrandSurface'];const _0x144c94=document['getElementById']('strandDebugToggle');_0x144c94&&(_0x144c94['textContent']=state['debugShowStrandSurface']?'기준면\x20숨기기':'기준면\x20보기',_0x144c94['classList']['toggle']('on',state['debugShowStrandSurface']));if(model3D&&model3D['initialized']){const _0x1ca7eb=model3D['headGroup']['getObjectByName']('strandEllipsoidDebug');if(_0x1ca7eb)_0x1ca7eb['visible']=state['debugShowStrandSurface'];}}function captureStrandPathsFor(_0x183426,_0x303717){return new Promise(_0x3b5842=>{const _0x49722a=state['hairMasks']&&state['hairMasks'][_0x183426],_0x200071=state['hairCanvases']&&state['hairCanvases'][_0x183426];if(!_0x49722a||!_0x49722a['scalpY']||!_0x200071){_0x3b5842(![]);return;}getCachedImg(_0x183426,_0x38f08a=>{if(!_0x38f08a){_0x3b5842(![]);return;}try{const _0x29ee7c=countValidCols(_0x49722a['scalpY']);if(_0x29ee7c<=_0x49722a['w']*0.05){_0x3b5842(![]);return;}const _0x29ac4f=document['createElement']('canvas');_0x29ac4f['width']=DRAW_RES,_0x29ac4f['height']=Math['round'](DRAW_RES*_0x38f08a['height']/_0x38f08a['width']);const _0x2538b0=_0x29ac4f['getContext']('2d'),_0x27be4f=computeFit(_0x38f08a['width'],_0x38f08a['height'],_0x29ac4f['width'],_0x29ac4f['height']);drawHairStrands(_0x2538b0,_0x27be4f,_0x49722a['scalpY'],_0x49722a['hairEndY'],_0x49722a['w'],_0x49722a['h'],_0x200071,buildStrandOpts(_0x49722a,_0x183426,!!_0x303717)),_0x3b5842(!!(state['strandPaths']&&state['strandPaths'][_0x183426]&&state['strandPaths'][_0x183426]['strands']['length']));}catch(_0x382834){console['warn']('오프스크린\x20가닥\x20캡처\x20실패('+_0x183426+'):',_0x382834),_0x3b5842(![]);}});});}
/* ==========================================================================
 * BODY_DRAPE v2 — 3D 결과 화면에서 머리를 몸·옷 겉면 위로 "닿은 듯 살짝 띄워" 늘어뜨림
 * (읽을 수 있는 코드로 13a 끝에 덧붙임)
 *
 * 순서
 *  1) 몸 겉면 → 거리장(SDF)
 *     장면의 bodyBaseRig(맨몸+옷) 삼각형을 머리 좌표계로 옮겨, x·y 칸마다 앞(ZF)·뒤(ZB)
 *     z를 기록 → 그 사이를 "몸 안"으로 채운 3D 칸(복셀)을 만들고, 칸마다 겉면까지의
 *     거리(밖 +, 안 −)를 잽니다. 그 다음 흐리게 해서 라펠·주머니·깃 같은 잔굴곡을
 *     지우고 몸의 큰 모양만 남깁니다. 기울기 = 겉면이 향한 방향(어깨는 위, 옆구리는 옆).
 *  2) 가닥 다시 잇기
 *     선분 쌍에서 끝=시작이면 같은 가닥. 결과 화면 선분 거르기로 중간이 빠져 끊긴
 *     조각도, 바로 앞 조각 끝에서 가깝고 아래로 이어지면 같은 가닥으로 봅니다.
 *  3) 선으로 밀기(점마다 붙이지 않음)
 *     ① 점마다 "겉면에서 margin 만큼 밖"까지 필요한 이동량만 계산(방향 = 거리장 기울기,
 *        몸 깊숙이 든 점은 가닥이 처음 몸에 들어간 자리의 방향을 그대로 씀 → 앞뒤가 섞이지 않음)
 *     ② 이동량을 가닥을 따라 부드럽게 퍼뜨림 → 원래 가닥에 더함(웨이브·컬 굴곡이 그대로 남음)
 *     ③ 뿌리부터 마디 길이를 원래대로 → 밀려난 만큼 늘어나지 않고 아래로 흘러내림
 *     ①~③을 몇 번 반복, 마지막에 남은 침범만 작게 한 번 더 밀어 마무리.
 *  4) 결과 화면에서는 BODY_OUT(고정 단면으로 z만 미는 옛 처리)을 쓰지 않습니다
 *     — 두 처리가 서로 다른 몸 모양·앞뒤 판단으로 두 번 밀던 것을 하나로.
 *
 * 원본 좌표를 보관해 몸·옷·머리가 바뀔 때마다 원본에서 다시 계산(누적 없음).
 * 끄기: BODY_DRAPE.on=false; BODY_DRAPE.refresh()   상태: BODY_DRAPE.lines()
 * ========================================================================== */
// 17a의 잔머리 정리(FLY_TRIM)를 끔 — 17a보다 먼저 로드되므로 기본값을 미리 넣어 둠.
// (결과 화면 '선분 거르기'가 렌더 때마다 머리 버퍼를 그 자리에서 고쳐 BODY_DRAPE와 엇갈리던 것)
// 다시 켜기: 콘솔에서 FLY_TRIM.on=true; FLY_TRIM.refresh()
window.FLY_TRIM = Object.assign({ on: false }, window.FLY_TRIM || {});
var BODY_DRAPE = (function () {
  'use strict';
  var TAG = '[몸 위로 늘어뜨리기]';
  var C = Object.assign({
    on: true,
    vox: 0.05,          // 복셀 크기(모델 단위 ≈ 0.95cm)
    xMax: 2.2,          // 좌우 반폭(팔까지)
    zMax: 1.3,          // 앞뒤 반깊이
    depth: 4.6,         // 목 밑동 아래로 볼 깊이
    above: 0.0,         // 목 밑동 위로는 안 봄(머리·목은 다른 처리 몫)
    blur: 2,            // 거리장 흐리기 횟수(클수록 잔굴곡이 사라짐)
    margin: 0.03,       // 겉면에서 띄울 거리 ≈ 0.6cm — "닿은 듯"
    iters: 4,           // ①~③ 반복
    smoothPts: 3,       // 이동량 퍼뜨리기 반폭(점 수)
    deepAt: -0.06,      // 이보다 깊이 든 점은 처음 들어간 자리의 방향으로 밂
    joinGap: 0.12,
    sideDamp: 0.35,     // 옆(x)으로 미는 몫 줄임 — 어깨에서 팔 쪽으로 미끄러지지 않고 앞/뒤로
    sideBias: 0.8,      // 어깨 윗면에서 정해진 쪽(앞/뒤)으로 기울이는 세기
    centerBand: 0.3,
    frontMin: 0.0,      // 원래 늘어지던 자리(목 아래 평균)가 몸통 가운데보다 이만큼 앞이면 앞으로    // |x|가 이보다 크면 옆머리 — 사진에서 앞으로 넘긴 쪽이면 앞      // 끊긴 조각 다시 잇기 거리
    replaceBodyOut: true,
    pollMs: 300,
    budgetMs: 12,       // 한 번에 쓰는 시간(ms) — 넘으면 다음 틈에 이어서
    log: true
  }, window.BODY_DRAPE || {});
  var S = C.stats = { newSrc: 0, reused: 0, strands: 0, joined: 0, touched: 0, pts: 0, left: 0, vox: 0, ms: 0, sdfMs: 0, err: null };
  var F = null, fieldSig = '', pendSig = '', applied = new WeakMap(), ver = 1, busy = false;

  function screen() { try { return currentScreen; } catch (e) { return ''; } }
  function headGroup() { try { return model3D && model3D.headGroup; } catch (e) { return null; } }

  /* ---------------- 장면 ---------------- */
  function findHairs(hg) {
    var out = [];
    hg.traverse(function (o) {
      if (o.visible === false) return;
      if ((o.name === 'adjustedHair' || o.name === 'hairStrands') && (o.isLineSegments || o.isLine) &&
          o.geometry && o.geometry.attributes && o.geometry.attributes.position) out.push(o);
    });
    return out;
  }
  function bodyMeshes(rig) {
    var out = [];
    rig.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
      for (var p = o; p && p !== rig; p = p.parent) if (p.visible === false) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      for (var i = 0; i < mats.length; i++) if (mats[i] && (mats[i].name || '').toLowerCase() === 'hair') return;
      out.push(o);
    });
    return out;
  }

  /* ---------------- 1) 거리장 ---------------- */
  // 삼각형을 x·y 칸 기둥으로 찍어 앞/뒤 z 범위를 얻음
  // obj → hg 상대 행렬을 각 노드의 '로컬' 행렬만으로 곱해 만듦.
  // matrixWorld는 마지막 렌더 때 값이라, 옷을 막 바꾼 뒤(새 몸/옷이 아직 한 번도 안 그려짐)에는
  // 머리는 지금 돌려 본 각도, 몸은 회전 없는 자리로 서로 어긋나 거리장이 보는 각도마다 달라졌음.
  function relTo(obj, hg) {
    var M = new THREE.Matrix4(), T = new THREE.Matrix4();
    for (var o = obj; o && o !== hg; o = o.parent) {
      if (o.matrixAutoUpdate) o.updateMatrix();
      T.copy(o.matrix); M.premultiply(T);
    }
    return M;
  }
  function columnSpans(meshes, toLocal, g, hg) {
    var NX = g.NX, NY = g.NY, v = g.vox;
    var ZF = new Float32Array(NX * NY).fill(-Infinity), ZB = new Float32Array(NX * NY).fill(Infinity);
    var M = new THREE.Matrix4(), q = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    function put(x, y, z) {
      var ix = ((x - g.x0) / v) | 0, iy = ((y - g.y0) / v) | 0;
      if (ix < 0 || iy < 0 || ix >= NX || iy >= NY || x < g.x0 || y < g.y0) return;
      var k = iy * NX + ix; if (z > ZF[k]) ZF[k] = z; if (z < ZB[k]) ZB[k] = z;
    }
    meshes.forEach(function (mesh) {
      M.multiplyMatrices(toLocal, relTo(mesh, hg));
      var e = M.elements, G = mesh.geometry, P = G.attributes.position, I = G.index, n = I ? I.count : P.count;
      for (var t = 0; t + 2 < n; t += 3) {
        for (var j = 0; j < 3; j++) {
          var vi = I ? I.getX(t + j) : t + j, x = P.getX(vi), y = P.getY(vi), z = P.getZ(vi);
          q[j * 3] = e[0] * x + e[4] * y + e[8] * z + e[12];
          q[j * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
          q[j * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        }
        if (Math.max(q[1], q[4], q[7]) < g.y0 || Math.min(q[1], q[4], q[7]) > g.y1) continue;
        var L = Math.max(Math.hypot(q[3] - q[0], q[4] - q[1], q[5] - q[2]), Math.hypot(q[6] - q[0], q[7] - q[1], q[8] - q[2]), Math.hypot(q[6] - q[3], q[7] - q[4], q[8] - q[5]));
        var N = Math.max(1, Math.min(48, Math.ceil(L / (v * 0.5))));
        for (var a = 0; a <= N; a++) for (var b = 0; b <= N - a; b++) {
          var u = a / N, w = b / N, r = 1 - u - w;
          put(q[0] * r + q[3] * u + q[6] * w, q[1] * r + q[4] * u + q[7] * w, q[2] * r + q[5] * u + q[8] * w);
        }
      }
    });
    return { ZF: ZF, ZB: ZB };
  }
  // 앞/뒤 범위 → 몸 안 복셀 → 부호 있는 거리(밖 +) → 흐리기
  function buildField(spans, g) {
    var NX = g.NX, NY = g.NY, NZ = g.NZ, v = g.vox, N = NX * NY * NZ;
    var inside = new Uint8Array(N);
    for (var iy = 0; iy < NY; iy++) for (var ix = 0; ix < NX; ix++) {
      var k = iy * NX + ix, zf = spans.ZF[k], zb = spans.ZB[k];
      if (zf === -Infinity) continue;
      var a = Math.max(0, Math.floor((zb - g.z0) / v)), b = Math.min(NZ - 1, Math.floor((zf - g.z0) / v));
      for (var iz = a; iz <= b; iz++) inside[(iz * NY + iy) * NX + ix] = 1;
    }
    // 빈 기둥 메우기(칸 사이 틈) — 좌우·위아래 이웃 두 곳 이상이 안이면 안
    var fill = inside.slice();
    for (var iz2 = 0; iz2 < NZ; iz2++) for (iy = 1; iy < NY - 1; iy++) for (ix = 1; ix < NX - 1; ix++) {
      var id = (iz2 * NY + iy) * NX + ix; if (inside[id]) continue;
      if (inside[id - 1] + inside[id + 1] + inside[id - NX] + inside[id + NX] >= 3) fill[id] = 1;
    }
    inside = fill;
    var mid = new Float32Array(NX * NY).fill(NaN);
    for (var km = 0; km < NX * NY; km++) if (spans.ZF[km] > -Infinity) mid[km] = (spans.ZF[km] + spans.ZB[km]) / 2;
    var dOut = chamfer(inside, 1, g), dIn = chamfer(inside, 0, g), sdf = new Float32Array(N), cnt = 0;
    for (var i = 0; i < N; i++) { sdf[i] = (inside[i] ? -(dIn[i] - 0.5) : (dOut[i] - 0.5)) * v; if (inside[i]) cnt++; }
    var raw = sdf;
    for (var bI = 0; bI < C.blur; bI++) sdf = boxBlur(sdf, g);
    return { g: g, sdf: sdf, raw: raw, inside: cnt, mid: mid };
  }
  // 3D 챔퍼 거리(3-4-5 근사, 칸 단위). target=1이면 "안 칸까지 거리", 0이면 "밖 칸까지 거리"
  function chamfer(inside, target, g) {
    var NX = g.NX, NY = g.NY, NZ = g.NZ, N = NX * NY * NZ, BIG = 1e6, d = new Float32Array(N);
    for (var i = 0; i < N; i++) d[i] = inside[i] === target ? 0 : BIG;
    var offs = [];
    for (var dz = -1; dz <= 1; dz++) for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var s = Math.abs(dx) + Math.abs(dy) + Math.abs(dz); if (!s) continue;
      offs.push([dx, dy, dz, s === 1 ? 1 : s === 2 ? 1.4142 : 1.7321]);
    }
    var fwd = offs.filter(function (o) { return o[2] < 0 || (o[2] === 0 && (o[1] < 0 || (o[1] === 0 && o[0] < 0))); });
    var bwd = offs.filter(function (o) { return fwd.indexOf(o) < 0; });
    function pass(list, z0, z1, st) {
      for (var z = z0; z !== z1; z += st) for (var y = st > 0 ? 0 : NY - 1; y >= 0 && y < NY; y += st) for (var x = st > 0 ? 0 : NX - 1; x >= 0 && x < NX; x += st) {
        var id = (z * NY + y) * NX + x, best = d[id]; if (!best) continue;
        for (var k = 0; k < list.length; k++) {
          var o = list[k], xx = x + o[0], yy = y + o[1], zz = z + o[2];
          if (xx < 0 || yy < 0 || zz < 0 || xx >= NX || yy >= NY || zz >= NZ) continue;
          var c = d[(zz * NY + yy) * NX + xx] + o[3]; if (c < best) best = c;
        }
        d[id] = best;
      }
    }
    pass(fwd, 0, NZ, 1); pass(bwd, NZ - 1, -1, -1);
    return d;
  }
  function boxBlur(a, g) {
    var NX = g.NX, NY = g.NY, NZ = g.NZ, b = new Float32Array(a.length), c = new Float32Array(a.length);
    var axes = [[1, NX], [NX, NY], [NX * NY, NZ]], src = a, dst = b;
    for (var ax = 0; ax < 3; ax++) {
      var st = axes[ax][0], n = axes[ax][1];
      for (var i = 0; i < src.length; i++) {
        var pos = ((i / st) | 0) % n, s = src[i], w = 1;
        if (pos > 0) { s += src[i - st]; w++; } if (pos < n - 1) { s += src[i + st]; w++; }
        dst[i] = s / w;
      }
      src = dst; dst = ax === 0 ? c : (ax === 1 ? b : c);
    }
    return src;
  }
  // 거리·기울기(삼선형 보간). 범위 밖이면 null
  var _gr = [0, 0, 0], _useRaw = false;
  function sample(x, y, z) {
    var g = F.g, v = g.vox;
    var fx = (x - g.x0) / v - 0.5, fy = (y - g.y0) / v - 0.5, fz = (z - g.z0) / v - 0.5;
    if (fx < 0 || fy < 0 || fz < 0 || fx >= g.NX - 1 || fy >= g.NY - 1 || fz >= g.NZ - 1) return null;
    var ix = fx | 0, iy = fy | 0, iz = fz | 0, tx = fx - ix, ty = fy - iy, tz = fz - iz;
    var NX = g.NX, NXY = NX * g.NY, s = _useRaw ? F.raw : F.sdf, i0 = (iz * g.NY + iy) * NX + ix;
    var c000 = s[i0], c100 = s[i0 + 1], c010 = s[i0 + NX], c110 = s[i0 + NX + 1];
    var c001 = s[i0 + NXY], c101 = s[i0 + NXY + 1], c011 = s[i0 + NXY + NX], c111 = s[i0 + NXY + NX + 1];
    var x00 = c000 + (c100 - c000) * tx, x10 = c010 + (c110 - c010) * tx, x01 = c001 + (c101 - c001) * tx, x11 = c011 + (c111 - c011) * tx;
    var y0 = x00 + (x10 - x00) * ty, y1 = x01 + (x11 - x01) * ty, d = y0 + (y1 - y0) * tz;
    var gx = ((c100 - c000) * (1 - ty) + (c110 - c010) * ty) * (1 - tz) + ((c101 - c001) * (1 - ty) + (c111 - c011) * ty) * tz;
    var gy = (x10 - x00) * (1 - tz) + (x11 - x01) * tz, gz = y1 - y0, L = Math.hypot(gx, gy, gz);
    if (L < 1e-9) { _gr[0] = 0; _gr[1] = 0; _gr[2] = 0; } else { _gr[0] = gx / L; _gr[1] = gy / L; _gr[2] = gz / L; }
    return d;
  }

  /* ---------------- 3) 선으로 밀기 ---------------- */
  var _L0 = new Float32Array(1024), _dx = new Float32Array(1024), _dy = new Float32Array(1024), _dz = new Float32Array(1024);
  var _px = new Float32Array(1024), _py = new Float32Array(1024), _pz = new Float32Array(1024);
  function drapeStrand(px, py, pz, n) {
    var g = F.g, m = C.margin, yTop = g.y1, any = false, i, it;
    for (i = 0; i < n; i++) if (py[i] < yTop) { any = true; break; }
    if (!any) return false;
    if (_L0.length < n) { _L0 = new Float32Array(n * 2); _dx = new Float32Array(n * 2); _dy = new Float32Array(n * 2); _dz = new Float32Array(n * 2); }
    var L0 = _L0;
    for (i = 1; i < n; i++) L0[i] = Math.hypot(px[i] - px[i - 1], py[i] - py[i - 1], pz[i] - pz[i - 1]);
    var dx = _dx, dy = _dy, dz = _dz, hit = false;
    var entry = null;                                         // 처음 몸에 들어간 자리의 바깥 방향
    var side = strandSide(px, py, pz, n);                     // +1 앞 · −1 뒤
    for (it = 0; it <= C.iters + 1; it++) {              // 마지막 두 회 = 마무리
      var last = it >= C.iters, need = 0;
      _useRaw = last;                                     // 마무리는 흐리지 않은 실제 겉면 기준 — 볼록한 어깨·라펠에서 묻히지 않게
      // ① 점마다 필요한 이동량
      for (i = 1; i < n; i++) {
        dx[i] = dy[i] = dz[i] = 0;
        if (py[i] >= yTop) continue;
        var d = sample(px[i], py[i], pz[i]); if (d === null || d >= m) continue;
        var nx = _gr[0], ny = _gr[1], nz = _gr[2];
        if (!entry && d > C.deepAt && (nx || ny || nz)) entry = [nx, ny, nz];
        if ((d < C.deepAt || !(nx || ny || nz)) && entry) { nx = entry[0]; ny = entry[1]; nz = entry[2]; }
        if (!(nx || ny || nz)) continue;
        if (!last) {                                          // 마무리 회는 겉면 방향 그대로(남은 침범을 확실히 빼냄)
          nx *= C.sideDamp;
          if (ny > 0) nz += side * C.sideBias * ny;             // 어깨 윗면: 정한 쪽으로 넘어가게
        }
        var nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        var k = m - d; dx[i] = nx * k; dy[i] = ny * k; dz[i] = nz * k; need++;
        if (it === 0) S.pts++;
      }
      if (!need) break;
      hit = true;
      // ② 가닥을 따라 퍼뜨림(마지막 회는 남은 것만 그대로)
      if (!last && C.smoothPts > 0) { spread(dx, n); spread(dy, n); spread(dz, n); }
      for (i = 1; i < n; i++) { px[i] += dx[i]; py[i] += dy[i]; pz[i] += dz[i]; }
      // ③ 뿌리부터 마디 길이 되돌림 — 밀린 만큼 아래로 흘러내림
      if (!last) for (i = 1; i < n; i++) {
        var ex = px[i] - px[i - 1], ey = py[i] - py[i - 1], ez = pz[i] - pz[i - 1], l = Math.hypot(ex, ey, ez);
        if (l < 1e-9 || !L0[i]) continue;
        var f = L0[i] / l; px[i] = px[i - 1] + ex * f; py[i] = py[i - 1] + ey * f; pz[i] = pz[i - 1] + ez * f;
      }
    }
    _useRaw = true;
    if (hit) for (i = 1; i < n; i++) if (py[i] < yTop) { var dd = sample(px[i], py[i], pz[i]); if (dd !== null && dd < 0) S.left++; }
    _useRaw = false;
    return hit;
  }
  // 가닥이 앞/뒤 어느 쪽으로 갈지: 목 밑동 높이에서의 z가 그 자리 몸통 가운데보다 앞이면 앞.
  // 옆머리(|x|>centerBand)는 사진에서 그쪽을 앞으로 넘겼으면 앞.
  var drapeInfo = null;
  function strandSide(px, py, pz, n) {
    var g = F.g, i, x = px[0], z = pz[0], y = g.y1;
    for (i = 1; i < n; i++) if (py[i] < g.y1) { x = px[i]; z = pz[i]; y = py[i]; break; }
    var own = true;                                           // 사진 인지는 손님 자기 머리일 때만 의미 있음
    try { var sid = state.specAppliedId; own = !sid || sid === '__original__'; } catch (e) {}
    if (own && Math.abs(x) > C.centerBand) {
      try {
        if (!drapeInfo) drapeInfo = SHOULDER.recognize();
        var f = drapeInfo && drapeInfo.front;
        if (f) { var right = (x >= 0) === (drapeInfo.signX > 0), sd = right ? f.R : f.L; if (sd && sd.draped) return 1; }
      } catch (e) {}
    }
    // 가닥이 원래 '어디로 늘어지려 했는지'로 정함: 목 밑동 아래 부분의 평균 z를 그 자리 몸통 가운데와 비교.
    // 한 다발은 끝이 같은 쪽으로 모이므로 다발째 같은 쪽으로 감(말안장·앞머리 벌어짐 방지).
    var sz = 0, sm = 0, cnt = 0;
    for (i = 1; i < n; i++) {
      if (py[i] >= g.y1) continue;
      var jx = Math.max(0, Math.min(g.NX - 1, ((px[i] - g.x0) / g.vox) | 0)), jy = ((py[i] - g.y0) / g.vox) | 0;
      if (jy < 0 || jy >= g.NY) continue;
      var mm = F.mid[jy * g.NX + jx]; if (mm !== mm) continue;
      sz += pz[i]; sm += mm; cnt++;
    }
    if (!cnt) return z >= 0 ? 1 : -1;
    return (sz - sm) / cnt >= C.frontMin ? 1 : -1;
  }
  // 이동량을 이웃 점에 퍼뜨리되 큰 값은 지킴(줄어들면 다시 파고드니까) — 움직이는 구간만
  var _tmp = new Float32Array(4096);
  function spread(a, n) {
    var lo = -1, hi = -1, i, j, w = C.smoothPts;
    for (i = 1; i < n; i++) if (a[i] !== 0) { if (lo < 0) lo = i; hi = i; }
    if (lo < 0) return;
    lo = Math.max(1, lo - w); hi = Math.min(n - 1, hi + w);
    if (_tmp.length < n) _tmp = new Float32Array(n * 2);
    for (i = lo; i <= hi; i++) {
      var s = 0, ws = 0;
      for (j = -w; j <= w; j++) { var k = i + j; if (k < 1 || k >= n) continue; var wt = w + 1 - (j < 0 ? -j : j); s += a[k] * wt; ws += wt; }
      var avg = s / ws, ai = a[i];
      _tmp[i] = (ai < 0 ? -ai : ai) > (avg < 0 ? -avg : avg) ? ai : avg;
    }
    for (i = lo; i <= hi; i++) a[i] = _tmp[i];
  }

  /* ---------------- 2) 가닥 다시 잇기 + 적용 ---------------- */
  // 한 머리 객체를 작은 조각 시간(budgetMs)씩 나눠 처리 → 화면이 멈추지 않음. 끝나면 한 번에 반영.
  function startJob(obj, done) {
    var geo = obj.geometry, P = geo.attributes.position;
    // 원본 찾기. 결과 화면의 '선분 거르기'(17a FLY_TRIM)가 내가 써 넣은 버퍼를 렌더 때마다 그 자리에서
    // 다시 고치므로 내용 비교로는 원본을 못 알아봄 → 머리 객체에 원본을 묶어 둠.
    // ① 같은 머리 객체 + 같은 길이 → 보관한 원본  ② 내 결과를 복사해 만든 새 객체 → 지문으로 찾음  ③ 그 밖 = 새 머리
    var cur = P.array, rec = objOrig.get(obj), orig = null;
    if (rec && rec.orig.length === cur.length) orig = rec.orig;
    if (!orig) { var o2 = outToOrig.get(checksum(cur)); if (o2 && o2.length === cur.length) orig = o2; }
    if (!orig) { orig = cur.slice(); S.newSrc++; } else S.reused++;
    objOrig.set(obj, { orig: orig });
    var a = orig.slice();                                    // 원본에서 새로 계산
    var nSeg = (a.length / 6) | 0, g2 = C.joinGap * C.joinGap, s0 = 0, s = 1, myVer = ver;
    function flush(s1) {
      var n = s1 - s0 + 1; if (n < 3) return;
      if (_px.length < n) { _px = new Float32Array(n * 2); _py = new Float32Array(n * 2); _pz = new Float32Array(n * 2); }
      var px = _px, py = _py, pz = _pz, k;
      px[0] = a[s0 * 6]; py[0] = a[s0 * 6 + 1]; pz[0] = a[s0 * 6 + 2];
      for (k = s0; k < s1; k++) { var q = k - s0 + 1; px[q] = a[k * 6 + 3]; py[q] = a[k * 6 + 4]; pz[q] = a[k * 6 + 5]; }
      S.strands++;
      if (!drapeStrand(px, py, pz, n)) return;
      S.touched++;
      for (k = s0; k < s1; k++) {
        var i0 = k - s0, o = k * 6;
        a[o] = px[i0]; a[o + 1] = py[i0]; a[o + 2] = pz[i0];
        a[o + 3] = px[i0 + 1]; a[o + 4] = py[i0 + 1]; a[o + 5] = pz[i0 + 1];
      }
    }
    function step() {
      if (myVer !== ver || !F) { done(false); return; }       // 그 사이 몸·설정이 바뀜 → 버림
      var t0 = performance.now();
      while (s <= nSeg) {
        if (s === nSeg) { flush(s); s++; break; }
        var o = s * 6, ddx = a[o] - a[o - 3], ddy = a[o + 1] - a[o - 2], ddz = a[o + 2] - a[o - 1];
        if (!(ddx === 0 && ddy === 0 && ddz === 0)) {
          if (ddx * ddx + ddy * ddy + ddz * ddz < g2 && ddy <= 0.02) S.joined++;   // 빠진 선분 건너 이어짐
          else { flush(s); s0 = s; }
        }
        s++;
        if ((s & 255) === 0 && performance.now() - t0 > C.budgetMs) { setTimeout(step, 0); return; }
      }
      P.array.set(a); P.needsUpdate = true;
      outToOrig.set(checksum(a), orig);                      // 이 결과 → 이 원본
      if (outToOrig.size > 6) outToOrig.delete(outToOrig.keys().next().value);
      var T = geo.attributes.tng;                               // 머리 빛(HAIR_LOOK)의 결 방향
      if (T && T.itemSize === 3 && T.count === P.count) {
        var ta = T.array;
        for (var v = 0; v + 1 < P.count; v += 2) {
          var ex = a[(v + 1) * 3] - a[v * 3], ey = a[(v + 1) * 3 + 1] - a[v * 3 + 1], ez = a[(v + 1) * 3 + 2] - a[v * 3 + 2], L = Math.hypot(ex, ey, ez) || 1e-9;
          ta[v * 3] = ta[(v + 1) * 3] = ex / L; ta[v * 3 + 1] = ta[(v + 1) * 3 + 1] = ey / L; ta[v * 3 + 2] = ta[(v + 1) * 3 + 2] = ez / L;
        }
        T.needsUpdate = true;
      }
      try { geo.computeBoundingSphere(); } catch (e) {}
      done(true);
    }
    step();
  }
  // 버퍼 내용 지문(길이 + 고르게 뽑은 값들의 합). 같은 내용이면 같은 값.
  var outToOrig = new Map(), objOrig = new WeakMap();
  function checksum(arr) {
    var n = arr.length, st = Math.max(1, (n / 4096) | 0), h1 = n, h2 = 0;
    for (var i = 0; i < n; i += st) { var v = arr[i]; h1 = (h1 * 31 + Math.round(v * 1e4)) | 0; h2 += v; }
    return n + ':' + h1 + ':' + h2.toFixed(3);
  }
  function restoreHair(obj) {
    var geo = obj.geometry, rec = objOrig.get(obj), orig = rec ? rec.orig : outToOrig.get(checksum(geo.attributes.position.array));
    if (orig && orig.length === geo.attributes.position.array.length) { geo.attributes.position.array.set(orig); geo.attributes.position.needsUpdate = true; }
  }

  /* ---------------- 감시 ---------------- */
  function gridFor(yTop) {
    var v = C.vox, g = { vox: v, x0: -C.xMax, y0: yTop - C.depth, z0: -C.zMax, y1: yTop };
    g.NX = Math.ceil(2 * C.xMax / v); g.NY = Math.ceil(C.depth / v); g.NZ = Math.ceil(2 * C.zMax / v);
    return g;
  }
  function tick() {
    try {
      if (busy || screen() !== 'model3d') return;
      var hg = headGroup(); if (!hg) return;
      var hairs = findHairs(hg); if (!hairs.length) return;
      if (!C.on) { hairs.forEach(function (h) { if (applied.has(h)) { restoreHair(h); applied.delete(h); wake(); } }); return; }
      var rig = hg.getObjectByName('bodyBaseRig'); if (!rig) return;
      var meshes = bodyMeshes(rig); if (!meshes.length) return;
      // 몸·옷 자리(위치·배율)까지 지문에 넣고, 두 번 연속 같을 때만(=옷 조각 불러오기가 끝나 멈췄을 때) 계산
      var rm = relTo(rig, hg).elements, rs = '';
      for (var ri = 0; ri < 16; ri++) rs += Math.round(rm[ri] * 1e4) + ',';
      var sig = rig.uuid + '@' + rs + meshes.map(function (m) { return m.uuid + ':' + m.geometry.attributes.position.count; }).join('|') + '#' + ver;
      if (sig !== fieldSig) { if (sig !== pendSig) { pendSig = sig; return; } }
      var todo = hairs.filter(function (h) { return applied.get(h) !== sig + ':' + h.geometry.attributes.position.array.length; });
      if (!todo.length && sig === fieldSig) return;
      var yTop; try { yTop = getNeckBottomY() + 0.02; } catch (e) { return; }
      if (!isFinite(yTop)) return;
      var t0 = performance.now();
      if (sig !== fieldSig || !F) {
        var toLocal = relTo(hairs[0], hg).invert(), g = gridFor(yTop);
        F = buildField(columnSpans(meshes, toLocal, g, hg), g); fieldSig = sig; todo = hairs; drapeInfo = null;
        S.sdfMs = performance.now() - t0; S.vox = F.inside;
        if (F.inside < 200) { S.err = '몸 겉면을 못 읽음(안 칸 ' + F.inside + ')'; F = null; fieldSig = ''; return; }
      }
      S.strands = S.joined = S.touched = S.pts = S.left = 0;
      busy = true;
      (function next(i) {
        if (i >= todo.length) {
          busy = false; S.ms = performance.now() - t0; S.err = null;
          if (C.log) console.log(C.lines()[0]);
          wake(); return;
        }
        var h = todo[i];
        startJob(h, function (ok) {
          if (!ok) { busy = false; return; }
          applied.set(h, sig + ':' + h.geometry.attributes.position.array.length); next(i + 1);
        });
      })(0);
    } catch (e) { S.err = String(e && e.message || e); console.warn(TAG, e); }
  }
  function wake() { try { if (typeof GPU_DIET !== 'undefined' && GPU_DIET.markDirty) GPU_DIET.markDirty(); } catch (e) {} }

  /* ---------------- 4) BODY_OUT 대신 ---------------- */
  function takeOverBodyOut() {
    try {
      if (typeof BODY_OUT === 'undefined' || BODY_OUT.__drapeWrapped) return;
      var orig = BODY_OUT._apply;
      BODY_OUT._apply = function (s) { return C.on && C.replaceBodyOut ? s : orig.apply(this, arguments); };
      BODY_OUT.__drapeWrapped = true;
      try { BODY_OUT.refresh(); } catch (e) {}
    } catch (e) {}
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    if (document.readyState === 'complete') takeOverBodyOut(); else window.addEventListener('load', takeOverBodyOut);
  }

  C.refresh = function () { ver++; busy = false; fieldSig = ''; pendSig = ''; F = null; try { BODY_OUT.refresh(); } catch (e) {} tick(); return C.on; };
  C.lines = function () {
    return [TAG + ' ' + (C.on ? '켜짐' : '꺼짐') + ' — 거리장 몸 안 칸 ' + S.vox + '(' + Math.round(S.sdfMs) + 'ms · 흐리기 ' + C.blur + ') · 가닥 ' + S.strands +
      '(끊긴 데 이음 ' + S.joined + ') 중 몸에 닿은 ' + S.touched + ' · 밀어낸 점 ' + S.pts + ' · 끝내 몸 안에 남은 점 ' + S.left +
      ' · 원본 새로 ' + S.newSrc + '/다시 씀 ' + S.reused + ' · 띄움 ' + (C.margin * 19.3).toFixed(1) + 'cm · ' + Math.round(S.ms) + 'ms' + (C.replaceBodyOut ? ' · BODY_OUT 대신 씀' : '') + (S.err ? ' ⚠ ' + S.err : '')];
  };
  C._test = { startJob: startJob, gridFor: gridFor, buildField: buildField, drapeStrand: drapeStrand, set: function (f) { F = f; }, sample: sample };
  if (typeof setInterval === 'function') setInterval(tick, C.pollMs);
  console.log(TAG + ' 설치 — 결과 화면에서 몸+옷 거리장으로 머리를 겉면 위로 살짝 띄워 늘어뜨림(BODY_OUT 대신). 끄기 BODY_DRAPE.on=false; BODY_DRAPE.refresh() · 상태 BODY_DRAPE.lines()');
  return C;
})();
