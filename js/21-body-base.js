/* =============================================================================
   21-body-base.js — 공용 마네킹
   옷마다 몸이 딸려오던 구조를 끝내고, 몸은 body_neutral.obj 하나로 고정한다.
   의상 OBJ는 옷만 들어 있고, 마네킹과 좌표계가 같아 배율 1로 겹친다.
   두신 6.5는 13a의 기존 배율 계산(neckCutFrac=1)이 그대로 지켜준다.
   ============================================================================= */

const BODY_BASE = {
  'on': !![],
  'objUrl': './assets/body_neutral.obj',
  'mtlUrl': './assets/body_neutral.mtl',
  'name': 'bodyBase'
};

var _bodyBaseSource = null;     // 한 번만 읽어두는 원본
var _bodyBasePromise = null;
var _bodyBaseFailed = ![];

function ensureBodyBase() {
  if (!BODY_BASE['on'] || _bodyBaseFailed) return Promise['resolve'](null);
  if (_bodyBaseSource) return Promise['resolve'](_bodyBaseSource);
  if (_bodyBasePromise) return _bodyBasePromise;

  _bodyBasePromise = new Promise(function (_res) {
    if (typeof THREE === 'undefined' || typeof THREE['OBJLoader'] !== 'function') {
      _bodyBaseFailed = !![];
      console['warn']('[3D·몸] OBJLoader 없음 — 마네킹 없이 진행합니다');
      _res(null);
      return;
    }
    var _finish = function (_mats) {
      var _l = new THREE['OBJLoader']();
      if (_mats) _l['setMaterials'](_mats);
      _l['load'](BODY_BASE['objUrl'], function (_obj) {
        _obj['traverse'](function (_o) {
          if (_o['isMesh'] && _o['geometry']) _o['geometry']['computeVertexNormals']();
        });
        _bodyBaseSource = _obj;
        var _bb = new THREE['Box3']()['setFromObject'](_obj);
        console['log']('[3D·몸] 마네킹 로드 — y ' + _bb['min']['y']['toFixed'](3) +
                       ' ~ ' + _bb['max']['y']['toFixed'](3) + ' (목 절단면이 위끝)');
        _res(_obj);
      }, undefined, function (_e) {
        _bodyBaseFailed = !![];
        console['warn']('[3D·몸] 마네킹 로드 실패 — 옷만 표시합니다:', _e);
        _res(null);
      });
    };
    if (BODY_BASE['mtlUrl'] && typeof THREE['MTLLoader'] === 'function') {
      var _m = new THREE['MTLLoader']();
      _m['load'](BODY_BASE['mtlUrl'], function (_mats) { _mats['preload'](); _finish(_mats); },
                 undefined, function () { _finish(null); });
    } else _finish(null);
  });
  return _bodyBasePromise;
}

/* 의상 루트 안에 마네킹 사본을 넣는다.
   머티리얼은 사본마다 새로 만든다 — 공유하면 13a의 sRGB 변환이 옷을 갈아입을 때마다
   같은 머티리얼에 겹쳐 걸려 색이 점점 어긋난다. */
function attachBodyBase(_root) {
  if (!_root || !BODY_BASE['on'] || !_bodyBaseSource) return ![];
  if (_root['getObjectByName'](BODY_BASE['name'])) return !![];
  try {
    var _c = _bodyBaseSource['clone'](!![]);
    _c['name'] = BODY_BASE['name'];
    _c['traverse'](function (_o) {
      if (!_o['isMesh'] || !_o['material']) return;
      _o['material'] = Array['isArray'](_o['material'])
        ? _o['material']['map'](function (_m) { return _m['clone'](); })
        : _o['material']['clone']();
    });
    _root['add'](_c);
    return !![];
  } catch (_e) {
    console['warn']('[3D·몸] 마네킹 붙이기 실패:', _e);
    return ![];
  }
}

function bodyBaseReady() { return !!_bodyBaseSource; }

/* 배율·목높이 기준은 마네킹 하나로 통일한다.
   옷마다 밑단 길이가 달라서(양말·구두·바지) 전체 바운딩박스를 쓰면
   같은 사람인데 옷을 갈아입을 때마다 몸 크기가 몇 % 씩 흔들린다. */
function bodyBaseBox(_root) {
  if (_root && bodyBaseReady()) {
    var _n = _root['getObjectByName'](BODY_BASE['name']);
    if (_n) return new THREE['Box3']()['setFromObject'](_n);
  }
  return new THREE['Box3']()['setFromObject'](_root);
}
