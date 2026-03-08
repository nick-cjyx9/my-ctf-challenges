const JavaScriptObfuscator = require('javascript-obfuscator');

const FLAG = process.env.FLAG || 'flag{test_flag_123}';

function encodeFlag(flag: string) {
  let binary = '';
  for (let i = 0; i < flag.length; i++) {
    binary += flag.charCodeAt(i).toString(2).padStart(8, '0');
  }
  return binary.replace(/0/g, 'e').replace(/1/g, 'i');
}

const encodedFlag = encodeFlag(FLAG);
const partLength = Math.ceil(encodedFlag.length / 5);
const flagParts: string[] = [];
for (let i = 0; i < 5; i++) {
  flagParts.push(encodedFlag.slice(i * partLength, (i + 1) * partLength));
}

const key = Math.floor(Math.random() * 255);
const encrypt = (str: string) => {
  return str.split('').map(c => c.charCodeAt(0) ^ key);
};
const encryptedParts = flagParts.map(encrypt);

const adjectives = ['super', 'hyper', 'mega', 'ultra', 'cyber', 'dark', 'light', 'fast', 'slow', 'big', 'tiny', 'f4ke', 'wr0ng', 'b4d'];
const nouns = ['flag', 'key', 'secret', 'pass', 'word', 'token', 'code', 'data', 'byte', 'bit', 'fl4g', 'k3y'];
const suffixes = ['123', '321', '007', '999', '_xyz', '_abc', '_lol', '_wow', '_sec', '_hacker', '_2024', '_2025'];

function generateFakeFlags(count: number): string[] {
  const fakes: string[] = [];
  for (let i = 0; i < count; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    fakes.push(`flag{${adj}_${noun}${suffix}}`);
  }
  return fakes;
}

const encryptedFakes = generateFakeFlags(20).map(encrypt);
const payload = `(function() {
  var key = ${key}; 
  var realFlagParts = ${JSON.stringify(encryptedParts)}; 
  var fakeFlags = ${JSON.stringify(encryptedFakes)}; 
  var decrypt = function(arr) {
      var s = '';
      for (var i = 0; i < arr.length; i++) {
          s += String.fromCharCode(arr[i] ^ key);
      }
      return s;
  };
  var nodes = [];
  for (var i = 0; i < 26; i++) {
      var comment = document.createComment('');
      document.body.appendChild(comment);
      nodes.push(comment);
  }
  var sequenceIndex = 0;
  setInterval(function() {
      var randomVal = Math.random();
      var showRealPart = randomVal < 0.9;
      var targetIndex = showRealPart ? Math.floor(Math.random() * 26) : -1;
      var currentPartIndex = sequenceIndex;
      if (showRealPart) {
          sequenceIndex = (sequenceIndex + 1) % 5;
      }
      for (var i = 0; i < 26; i++) {
          var text = '';
          if (i === targetIndex) {
              text = decrypt(realFlagParts[currentPartIndex]);
              if (currentPartIndex === 0) { 
                  text = "Here's your flag: " + text; 
              }
          } else {
              var fakeIndex = Math.floor(Math.random() * fakeFlags.length);
              text = decrypt(fakeFlags[fakeIndex]);
          }
          nodes[i].textContent = text;
      }
  }, 100);
})();`;
await Bun.file('./public/eieieieea.js').write(
  JavaScriptObfuscator.obfuscate(payload,
    {
      compact: false,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 1,
      numbersToExpressions: true,
      simplify: true,
      stringArrayShuffle: true,
      splitStrings: true,
      stringArrayThreshold: 1
    }).getObfuscatedCode()
)

Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(Bun.file('./public/new-year.html'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (url.pathname === '/eieieieee.js') {
      return new Response(Bun.file('./public/eieieieee.js'), {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }

    if (url.pathname === '/eieieieee.png') {
      return new Response(Bun.file('./public/eieieieee.png'), {
        headers: { 'Content-Type': 'image/png' },
      });
    }

    if (url.pathname === '/eieieieee.mp3') {
      return new Response(Bun.file('./public/eieieieee.mp3'), {
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    }

    if (url.pathname === '/eieieieea.js') {
      return new Response(Bun.file('./public/eieieieea.js'), {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }
    return new Response('Not Found', { status: 404 });
  },
});
