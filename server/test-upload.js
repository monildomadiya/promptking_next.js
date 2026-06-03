const fs = require('fs');

async function testUpload() {
  // Create dummy image
  fs.writeFileSync('dummy.jpg', Buffer.from('ffd8ffe000104a46494600010101004800480000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232ffc00011080001000103012200021101031101ffc4001500010100000000000000000000000000000005ffc40014100100000000000000000000000000000000ffc4001501010100000000000000000000000000000000ffc40014110100000000000000000000000000000000ffda000c03010002110311003f00509400fffd', 'hex'));
  
  const form = new FormData();
  const file = new File([fs.readFileSync('dummy.jpg')], 'dummy.jpg', { type: 'image/jpeg' });
  form.append('image', file);
  
  console.log("Sending...");
  const res = await fetch('http://localhost:5000/api/admin/upload_image', {
    method: 'POST',
    body: form,
    headers: { 'x-admin-token': 'test' }
  });
  
  const data = await res.text();
  console.log(res.status, data);
}
testUpload();
