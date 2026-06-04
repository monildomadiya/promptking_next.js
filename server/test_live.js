fetch('https://api.promptking.in/api/get_data').then(res=>res.json()).then(data=> { 
  console.log("Total prompts:", data.prompts.length);
  data.prompts.slice(0, 10).forEach(p => {
    console.log(`Key: ${p.key}, sort_order: ${p.sort_order}, isFeatured: ${p.isFeatured}`);
  });
}).catch(console.error);
