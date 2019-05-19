const translations = {
  SIUN: 'units',
  UNIT: 'units',
  STNM: 'name',
  RMRK: 'comment',
  TIMO: 'offset'
};

const ignore = ['EMPT', 'TSMP', 'TICK', 'TOCK'];

const stickyTranslations = {
  TMPC: 'temperature',
  GPSF: 'Fix',
  GPSP: 'Precision'
};

function deepEqual(a, b) {
  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) return a === b;
  if (Object.keys(a).length !== Object.keys(b).length) return false;
  for (let i = 0; i < Object.keys(a).length; i++) if (!deepEqual(a[Object.keys(a)[i]], b[Object.keys(a)[i]])) return false;
  return true;
}

function mergeDEVCs(klv, options) {
  let result = { sensors: {} };
  (klv.DEVC || []).forEach(d => {
    (d.STRM || []).forEach(s => {
      if (s.interpretSamples) {
        const fourCC = s.interpretSamples;
        if (options.sensor == null || options.sensor.includes(fourCC)) {
          let samples = s[fourCC];
          delete s[fourCC];
          delete s.interpretSamples;
          let sticky = {};
          let description = {};
          for (const key in s) {
            if (translations[key]) description[translations[key]] = s[key];
            //TODO, discard these keys if not used
            else if (ignore.includes(key)) description[key] = s[key];
            else sticky[key] = s[key];
          }
          if (Object.keys(sticky).length && samples.length) {
            let prevSticky = {};
            ((result.sensors[fourCC] && result.sensors[fourCC].samples) || []).forEach(s => {
              if (s.sticky) for (const key in s.sticky) prevSticky[key] = s.sticky[key];
            });

            for (let key in sticky) {
              if (!deepEqual(sticky[key], prevSticky[stickyTranslations[key] || key])) {
                samples[0].sticky = samples[0].sticky || {};
                samples[0].sticky[stickyTranslations[key] || key] = sticky[key];
              }
            }
          }
          if (result.sensors[fourCC]) result.sensors[fourCC].samples.push(...samples);
          else result.sensors[fourCC] = { samples, ...description };
        }
      }
    });
    delete d.DVID;
    delete d.interpretSamples;
    delete d.STRM;
    for (const key in d) {
      if (translations[key]) result[translations[key]] = d[key];
      else result[key] = d[key];
    }
  });
  return result;
}

module.exports = mergeDEVCs;
