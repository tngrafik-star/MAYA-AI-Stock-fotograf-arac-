// AI Metadata Simulator for MayaListing
// Generates realistic stock & e-commerce metadata based on category and language selection

const CATEGORY_TEMPLATES_EN = {
  decor: {
    name: 'Lifestyle & Decor',
    titles: [
      'Minimalist Ceramic Mug with Natural Wooden Tray',
      'Bohemian Style Dried Flowers in an Earthy Ceramic Pot',
      'Natural Soy Candles on a Luxury Marble Tray',
      'Linen-Textured Decorative Pillow on a Rustic Armchair'
    ],
    descriptions: [
      'Handmade ceramic coffee mug and a chic wooden serving tray shot in a modern room with natural light. Home decor and quiet lifestyle concept.',
      'Dried pampas grass arrangement in a matte terracotta pot with a linen-detail background. Minimalist interior design and warm atmosphere.',
      'Handmade soy candle with calming aromatherapy effect burning on a marble serving tray. Aesthetic spa and home self-care theme.',
      'Beige linen-fabric cushion on wooden furniture creating an aesthetic and comfortable corner. Warm Scandinavian home style.'
    ],
    keywords: [
      'home decor, ceramic mug, minimalist living, scandinavian style, coffee time, handmade ceramic, wooden tray, natural living, aesthetic room, bohemian decor, earth tones, calm atmosphere, dried flowers, soy candle, marble tray, linen pillow, rustic style, cozy home, home textile, handcrafted'
    ],
    ecommerce: {
      title: 'Handmade Ceramic Coffee Mug | Custom Design Cup | Gift Mug - Minimalist Scandinavian Series',
      description: `✨ Fully handmade ceramic mug that will add aesthetics to your home and coffee times.

• Material: High-quality stoneware clay and food-safe matte glaze.
• Volume: Approximately 320 ml.
• Gift Option: Shipped in a stylish kraft box with protective packaging.`,
      tags: 'ceramic mug, handmade mug, coffee cup, design mug, gift cup, kitchen decor, scandinavian mug, coffee lover, handmade ceramic, natural mug'
    }
  },
  cosmetics: {
    name: 'Cosmetics & Beauty',
    titles: [
      'Moisturizing Skin Serum in a Glass Bottle with Dropper',
      'Organic Face Cream with Wooden Spatula',
      'Natural Clay Mask with Eco Bamboo Brush',
      'Cosmetic Oil Bottle with Rose Petals in Soft Light'
    ],
    descriptions: [
      'Clean-ingredient moisturizing face serum in a clear glass bottle with dropper on a minimalist background. Luxury skincare and beauty routine.',
      'Nourishing organic night cream in a matte glass jar presented with a wooden spatula. Natural beauty and wellness concept product photo.',
      'Green clay mask prepared in a ceramic bowl and a bamboo application brush. Skin purification, detox and spa salon theme.',
      'Herbal massage oil in a glass dropper bottle surrounded by fresh pink rose petals. Aromatherapy, relaxation and natural cosmetics product shoot.'
    ],
    keywords: [
      'skincare, face serum, cosmetic bottle, organic beauty, natural cosmetics, glass dropper, moisturizing serum, spa and wellness, clean ingredients, skincare routine, beauty product, massage oil, clay mask, organic cream, bamboo brush, aromatherapy, herbal oil, luxury cosmetics, smooth skin, personal care'
    ],
    ecommerce: {
      title: 'Organic Moisturizing Skin Serum | 100% Natural Hyaluronic Acid & Vegan Face Serum - Anti-Aging Glow',
      description: `🌿 Naturally restore the intense moisture and radiance your skin needs.

• Ingredients: Hyaluronic Acid, Aloe Vera Extract, Organic Rose Water and Vitamin E.
• Effect: Penetrates deeper skin layers, plumps fine lines, creates an intense moisture barrier.
• Volume: 30ml amber glass bottle with dropper.`,
      tags: 'face serum, skincare, organic serum, natural cosmetics, moisturizer, hyaluronic acid, vegan cosmetics, anti aging, clean beauty, glowing skin'
    }
  },
  tech: {
    name: 'Technology & Accessories',
    titles: [
      'Elegant Wireless Over-Ear Bluetooth Headphones',
      'Matte Black Smartwatch with Magnetic Charging Unit',
      'Metallic Laptop on a Minimalist Work Desk',
      'Slim Smartphone with Wireless Charging Stand'
    ],
    descriptions: [
      'Premium matte grey wireless over-ear headphones with advanced noise cancellation. Technology product shot in a clean and stylish studio background.',
      'Matte black stainless steel smartwatch with health tracking and sports modes on a minimalist stand. Modern wearable technology detail.',
      'Slim aluminum laptop closed on a stylish desk setup. Home office and productivity concept.',
      'Three-camera luxury smartphone with a burnt orange leather case on a vertical wireless charging unit. Mobile technology and accessories.'
    ],
    keywords: [
      'smartwatch, wireless headphones, bluetooth headphones, wearable tech, smartphone, laptop, tech accessories, matte black, metallic design, minimalist desk, home office, premium headphones, wireless charging, phone case, productivity, sound system, sport watch, leather case, modern office, luxury tech'
    ],
    ecommerce: {
      title: 'Premium Active Noise Cancelling (ANC) Wireless Bluetooth Headphones | 40 Hour Playback Over-Ear Headphones - Matte Black',
      description: `🎧 Silence the outside world and focus on the depths of music.

• Sound Quality: Hi-Res Audio certified, 40mm dynamic drivers with deep bass and crystal clear highs.
• Active Noise Cancellation (ANC): Blocks external sounds up to 90%.
• Battery Life: Up to 30 hours with ANC on, 40 hours with ANC off per single charge.`,
      tags: 'bluetooth headphones, wireless headphones, noise cancelling, anc headphones, black headphones, music headphones, gaming headphones, tech gift, travel headphones'
    }
  },
  food: {
    name: 'Food & Beverage',
    titles: [
      'Freshly Ground Coffee Beans and Coffee Brewing Equipment',
      'Extra Virgin Olive Oil Bottle with Rosemary on Dark Background',
      'Freshly Baked Sourdough Bread Slices on Wooden Board',
      'Iced Hibiscus Tea with Fresh Mint Leaves in Glass'
    ],
    descriptions: [
      'Fresh filter coffee brewing via pour-over (V60) method with roasted coffee beans around. Specialty coffee culture photograph.',
      'Cold-pressed homemade extra virgin olive oil in a dark green glass bottle with fresh thyme and rosemary branches on rustic dark wooden table.',
      'Crispy crust freshly baked sourdough bread, porous inside. Rustic artisan bakery shot on linen cloth.',
      'Refreshing red hibiscus tea in a clear glass with melting ice cubes and fresh green mint. Natural cold beverage concept.'
    ],
    keywords: [
      'filter coffee, coffee bean, olive oil, organic food, sourdough bread, baking, cold beverage, hibiscus tea, rustic food photography, fresh spices, cold pressed, organic olive oil, v60 brewing, specialty coffee, coffee shop, healthy eating, artisan bread, fresh mint, iced tea, gourmet flavors'
    ],
    ecommerce: {
      title: 'Aegean Cold-Pressed Extra Virgin Olive Oil | 100% Organic Early Harvest Olive Oil - 500ml Elegant Glass Bottle',
      description: `🌿 Superior quality extra virgin olive oil obtained by cold-pressing early harvest olives from ancient Aegean olive trees.

• Acidity: Maximum 0.3% oleic acid (Ultra low acidity).
• Flavor Profile: Rich fruity taste with aromas of freshly cut grass, green apple and tomato leaf.`,
      tags: 'extra virgin olive oil, cold pressed, early harvest, organic olive oil, gourmet, natural oil, aegean olive oil, salad oil, healthy eating, glass bottle oil, gift olive oil'
    }
  },
  landscape: {
    name: 'Nature & Landscape',
    titles: [
      'Pine Forest Under Mist and Smoky Mountain Peaks',
      'Wavy Sea with Golden Reflections at Sunset',
      'Forest Path Covered with Golden Yellow Leaves in Autumn',
      'Snowy Camping Tent Under a Starry Sky'
    ],
    descriptions: [
      'Majestic mountain range and dense pine trees covered with a layer of fog in the early morning hours. Wild nature and adventure.',
      'Golden light reflections created by the setting evening sun as foamy ocean waves crash onto the shore. Peaceful nature and vacation theme.',
      'A winding forest path covered with fallen yellow and orange autumn leaves stretching into the distance. Tranquility and seasonal transition.',
      'Orange camping tent illuminated from inside under the Milky Way galaxy in the clear winter sky. Adventure and outdoor sports.'
    ],
    keywords: [
      'pine forest, misty mountains, sunset, ocean waves, golden hour, autumn leaves, forest path, winter camp, camping tent, milky way, starry sky, wild nature, landscape photography, outdoor adventure, travel routes, tranquility, travel diary, mountain climbing, nature walk, wilderness'
    ],
    ecommerce: {
      title: 'Misty Pine Forest Landscape Premium Wall Poster | Large Format Nature-Themed Print - Artistic Framed Print',
      description: `🌲 Special artistic photo print that will change the atmosphere of your home or office and bring the peace of nature to your walls.

• Print Quality: Ultra-high resolution print on 250gr museum-quality acid-free matte fine art paper.
• Frame Detail: Minimalist matte black wooden frame with break-resistant high transparency plexiglas protection.`,
      tags: 'wall poster, nature print, framed art, forest poster, minimalist art, fine art print, home gift, living room decor, large format poster, artistic photo, landscape art'
    }
  },
  fashion: {
    name: 'Fashion & Apparel',
    titles: [
      'Modern Denim Jacket and White T-Shirt Combination in Studio',
      'Stylish Women Sunglasses and Trench Coat in Street Style',
      'Retro Leather Boot and Woven Bag Detail',
      'Summer Hat and Linen Dress in Pastel Tones'
    ],
    descriptions: [
      'New season denim jacket and sporty chic concept fashion photography under minimalist studio light.',
      'A stylish woman with trendy sunglasses and a classic trench coat walking in the city center on a sunny day.',
      'Retro-style brown leather boots and a hand-woven linen bag on a shoulder on old cobblestone streets.',
      'Straw hat and flowing beige linen dress detail wearable at the beach or a summer party.'
    ],
    keywords: [
      'fashion apparel, denim jacket, street style, trench coat, sunglasses, new season, studio shoot, retro fashion, leather boots, woven bag, summer dress, linen fabric, straw hat, style outfit, chic clothing, youth style, autumn fashion, textile product, wardrobe, daily elegance'
    ],
    ecommerce: {
      title: 'Unisex Oversize Denim Jacket | New Season Premium Denim Jacket - Classic Blue',
      description: `🧥 Premium denim jacket with a timeless design that will be the savior piece of your wardrobe.

• Fabric: 100% cotton denim, durable and breathable texture.
• Cut: Modern oversize cut, compatible fit for every size.`,
      tags: 'denim jacket, oversize jacket, unisex jacket, blue jacket, street fashion, premium denim, cotton jacket, trend jacket, fashion gift'
    }
  },
  fitness: {
    name: 'Sports & Wellness',
    titles: [
      'Woman Exercising on Yoga Mat with Sports Water Bottle',
      'Running Shoe Detail on Running Track at Late Afternoon Light',
      'Steel Dumbbells and Sweat Towel in Fitness Gym',
      'Detox Smoothie and Fresh Fruits on Natural Wooden Table'
    ],
    descriptions: [
      'Female athlete doing exercise movements on a green yoga mat in a calm studio with a steel water bottle nearby.',
      'Dynamic movement moment of a runner near sunset on a running track with sports shoes.',
      'Chrome-plated dumbbells on a weight rack and a microfiber towel in a professional fitness gym.',
      'Green spinach and banana smoothie in a glass bottle with fresh kiwi and chia seeds around.'
    ],
    keywords: [
      'healthy living, yoga mat, sports water bottle, exercise, running shoes, gym, dumbbell weights, detox smoothie, green drink, chia seeds, sports nutrition, cardio, fitness training, pilates, healthy eating, active lifestyle, sweat towel, motivation, morning workout, stretching'
    ],
    ecommerce: {
      title: 'Dual-Color Non-Slip TPE Yoga and Pilates Mat | 6mm Thickness Sports Mat - Eco-Friendly and Durable',
      description: `🧘‍♀️ High-density non-slip yoga mat to make your exercises more comfortable and safe.

• Material: Eco-friendly, recyclable TPE (Latex and PVC free).
• Thickness: 6mm optimal thickness protects your joints and facilitates balance.`,
      tags: 'yoga mat, pilates mat, sports mat, non-slip mat, exercise mat, home workout, fitness equipment, tpe mat, healthy lifestyle, blue mat, sports gift'
    }
  },
  business: {
    name: 'Business & Office',
    titles: [
      'Employees and Whiteboard in a Modern Meeting Room',
      'Designer Drawing Tablet and Notebook on Office Desk',
      'Analyst Doing Financial Graph Analysis with Calculator',
      'Young Team Brainstorming Behind Glass'
    ],
    descriptions: [
      'Professional team writing notes on a whiteboard and brainstorming in a bright meeting room with wide windows.',
      'Drawing tablet, stylus pen and a stylish notebook with a coffee cup on a graphic designer desk.',
      'Expert analyzing budget and sales graphs printed on light-colored papers in a bright environment.',
      'Young entrepreneur team planning a new project by pinning colorful sticky notes on the office glass partition.'
    ],
    keywords: [
      'business, meeting room, brainstorming, office desk, graphic tablet, drawing pen, financial analysis, sales chart, young entrepreneurs, sticky notes, collaboration, office environment, corporate life, career, modern office, planning meeting, business management, data analysis, digital design, teamwork'
    ],
    ecommerce: {
      title: 'Smart Leather Desk Pad and Office Organizer | Premium Leather Keyboard Mouse Pad - Large Brown',
      description: `💼 Premium handmade leather desk pad that will bring luxury and order to your office desk.

• Material: 100% first quality faux leather (easy to clean, waterproof).
• Size: 80cm x 40cm wide surface area.`,
      tags: 'leather desk pad, desk organizer, office accessory, mouse pad, large mouse pad, work desk, gift office, corporate gift, stylish office, home office'
    }
  },
  architecture: {
    name: 'Architecture & Building',
    titles: [
      'City View and Geometric Structures from Skyscraper Glass',
      'Spiral Stairs and Light Play in Modern Museum Building',
      'Brick Wall and Steel Beams in Loft Style Home',
      'Wooden Windows and Ivy of a Historic Stone Mansion'
    ],
    descriptions: [
      'Reflective glass surfaces of modern architecture skyscrapers and a geometric frame taken from below.',
      'Huge spiral staircase in the reinforced concrete architecture of the art museum and natural daylight filtering from above.',
      'Industrial-inspired brick wall cladding, black metal details and pendant lamps in a high-ceilinged loft apartment.',
      'Green ivy surrounding the arched wooden windows of a restored stone house with traditional architecture.'
    ],
    keywords: [
      'modern architecture, skyscrapers, geometric structures, spiral stairs, museum building, interior design, loft apartment, brick wall, industrial design, stone mansion, wooden window, ivy, reinforced concrete, light reflection, urban texture, restoration, building facade, minimal architecture, architectural detail, art gallery'
    ],
    ecommerce: {
      title: '3D Brick Pattern Self-Adhesive Wall Panel | Heat and Sound Insulated Decorative Wallpaper - Pack of 10',
      description: `🧱 Decorative adhesive panel to change the atmosphere of your home without calling a professional.

• Material: Soft polyethylene foam (protective against impacts, suitable for children rooms).
• Application: Simply remove the protective tape and stick to a clean wall. Can be easily cut with scissors.`,
      tags: 'wall panel, adhesive panel, brick pattern, wallpaper, home decor, insulated panel, practical decor, living room wall, 3d wallpaper, foam panel'
    }
  },
  animals: {
    name: 'Pets & Wildlife',
    titles: [
      'Cute Tabby Cat Sunbathing by the Window',
      'Golden Retriever Running in the Park with Wet Nose',
      'Bright Orange Japanese Goldfish Gliding in Aquarium',
      'Green Budgerigar on a Branch with Colorful Feathers'
    ],
    descriptions: [
      'A cute green-eyed tabby cat stretched out on a sunlit window sill.',
      'A happy and energetic Golden Retriever dog running with tongue out in greenery.',
      'A cute orange ornamental fish gliding with shimmering scales among aquarium plants.',
      'A lively yellow-green budgerigar standing upright on a wooden perch outside the cage or in its natural environment.'
    ],
    keywords: [
      'pet, tabby cat, cute cat, cat eyes, golden retriever, happy dog, dog training, goldfish, aquarium plants, budgerigar, colorful feathers, animal love, veterinary, cat food, dog toy, pet care, nature and animals, cute paw, furry friends, domestic animal'
    ],
    ecommerce: {
      title: 'Orthopedic Calming Plush Cat and Dog Bed | Washable Fluffy Round Pet Bed - Grey (60cm)',
      description: `🐱 Ultra-soft plush bed designed for your furry friends to have the most comfortable and deep sleep.

• Material: First-class fluffy plush fabric and antibacterial bead fiber fill.
• Design: The round donut design makes your cat or dog feel safe and cuddled.`,
      tags: 'cat bed, dog bed, plush bed, pet bed, fluffy bed, orthopedic bed, cat nest, dog nest, washable bed, cat supplies, grey bed, pet accessory'
    }
  },
  travel: {
    name: 'Travel & Culture',
    titles: [
      'Colorful Houses and Cobblestone Streets in the Old City',
      'Historic Castle and Green Valley View at the Mountain Foot',
      'Colorful Exotic Spices in Sacks at a Spice Market',
      'Traveler with Backpack Finding Way with Map and Compass'
    ],
    descriptions: [
      'Old cobblestone street in a historic neighborhood with pastel-colored windowed houses on both sides.',
      'Majestic historic castle ruins built on steep rocks and the river valley stretching below.',
      'Red chili flakes, yellow turmeric, cardamom and cinnamon sticks in sacks lined up side by side in a traditional bazaar.',
      'A tourist drawing their route on a world map on a wooden table with a brass compass.'
    ],
    keywords: [
      'travel, old city, colorful houses, cobblestone, historic castle, green valley, spice market, exotic spices, backpacker, world map, compass, tourism, holiday destination, history and culture, travel diary, adventure travel, cultural heritage, old streets, explorer, photo journey'
    ],
    ecommerce: {
      title: 'Waterproof Multi-Function Travel Backpack | USB Charging Port Large Capacity Luggage Bag - Unisex Black',
      description: `✈️ Smart backpack to keep all your belongings organized on your travels, business trips or daily life.

• Material: High-density water-resistant oxford fabric.
• Compartments: 15.6 inch padded laptop compartment, wet/dry separation pocket and hidden passport pocket.`,
      tags: 'travel bag, backpack, laptop bag, cabin size bag, waterproof bag, usb bag, luggage bag, black backpack, unisex bag, camping bag, travel gear, gift bag'
    }
  },
  automotive: {
    name: 'Automotive & Vehicles',
    titles: [
      'Sports Car Front Grille and Headlights in City Lights at Night',
      'Off-Road Vehicle on a Dusty Road with Mud Detail',
      'Classic Red Motorcycle and Leather Helmet Detail',
      'Car Speeding on an Empty Highway at Sunset'
    ],
    descriptions: [
      'The lens-style LED headlights of a luxury sports car with sharp lines reflecting neon lights at night.',
      'Dynamic moment of a 4x4 off-road vehicle speeding through a muddy puddle on mountainous terrain.',
      'Vintage motorcycle with shining chrome parts parked in a garage or by the seaside with a leather helmet on the handlebar.',
      'A modern passenger car disappearing on a long highway under the orange light of the setting sun on the horizon.'
    ],
    keywords: [
      'automotive, sports car, LED headlights, luxury car, off-road, terrain vehicle, 4x4, muddy road, classic motorcycle, vintage bike, leather helmet, highway, sunset drive, car design, speed passion, driving pleasure, car modification, vehicle maintenance, motorcycle accessories, road scenery'
    ],
    ecommerce: {
      title: 'High-Resolution Night Vision Dashboard Camera | Full HD 1080P G-Sensor Auto Road Recording Device - 170 Degree Angle',
      description: `🚗 Smart dash cam that maximizes your driving safety and automatically locks accident footage.

• Resolution: Real 1080P Full HD recording quality captures plates and details clearly.
• Night Vision: WDR technology records high-quality images at night and in low light.`,
      tags: 'dash cam, car camera, road recorder, hd camera, night vision camera, car interior accessories, g-sensor camera, accident camera, auto electronics, safe driving'
    }
  },
  portrait: {
    name: 'People & Portrait',
    titles: [
      'Portrait Photo of a Young Smiling Woman Outdoors',
      'Thoughtful Facial Expression of an Old Man Reading a Book',
      'Happy Family and Children Laughing Together in the Park',
      'Focused Hands of a Craftsman Working in Natural Light'
    ],
    descriptions: [
      'Portrait of a young woman with blurred background (bokeh effect) looking at the camera with a sincere smile in daylight.',
      'Portrait of a wise old man reading an old book with glasses at the tip of his nose in a library or at home.',
      'A mother, father and child lying on the grass on a sunny day, hugging each other and laughing out loud.',
      'Detailed hand movements and sweat on the brow of a craftsman shaping clay pottery or carving wood in his workshop.'
    ],
    keywords: [
      'human portrait, smiling woman, outdoor shoot, bokeh background, elderly man, book reading, family happiness, children laugh, park picnic, craftsman hands, focus, sincere expression, human emotions, lifestyle, daily life, portrait photography, natural light, workshop, mother child, happy moments'
    ],
    ecommerce: {
      title: 'Portable LED Ring Light with Tripod Set | TikTok and YouTube Live Streaming Lamp - 3 Color Modes 10 Brightness Levels',
      description: `📸 Ideal ring light stand for professional portrait shoots, makeup videos and live streams.

• Light Diameter: 10 inch (26cm) LED ring light.
• Color Modes: 3 different color tones: Warm Yellow, Natural White, Cool White.`,
      tags: 'ring light, tripod set, led ring, studio light, live stream light, tiktok light, youtube light, selfie light, portrait light, makeup light'
    }
  },
  other: {
    name: 'Other / General',
    titles: [
      'Minimalist Object Shoot in Studio Light',
      'Colorful Abstract Pattern and Texture Detail',
      'Professional Product Shoot on Modern Background',
      'Creative Concept Photo with Depth'
    ],
    descriptions: [
      'Professional product or concept photography taken in a minimalist and clean studio environment.',
      'Abstract background texture with vivid colors and aesthetic transitions usable in design projects.',
      'High-quality object photography in front of a modern and stylish background with details highlighted.',
      'Concept studio shoot with creative ideas, artistic perspective and high sense of depth.'
    ],
    keywords: [
      'minimalist shoot, studio photo, product photography, abstract pattern, colorful texture, professional photography, high quality, concept design, artistic view, modern background, aesthetic visual, object shoot, creative concept, design element, vivid colors, soft light, detail shot, stock image, commercial use, depth sense'
    ],
    ecommerce: {
      title: 'Custom Design Product | Multi-Purpose Premium Design Object',
      description: `✨ Special design product made with high-quality materials that will add aesthetics and functionality to your life.

• Design: Unique look with modern, elegant and minimalist lines.
• Material: First-class quality and long-lasting raw material usage.`,
      tags: 'design product, premium quality, custom design, home accessory, office accessory, multi-purpose product, gift ideas, modern design, aesthetic objects, quality product'
    }
  }
};

const CATEGORY_TEMPLATES = {
  decor: {
    name: 'Yaşam & Dekorasyon',
    titles: [
      'Minimalist Seramik Kupa ve Doğal Ahşap Altlık',
      'Bohem Tarzı Toprak Saksıda Kuru Çiçek Aranjmanı',
      'Doğal Soya Mumları ve Lüks Mermer Tepsi',
      'Keten Dokulu Dekoratif Kırlent ve Rustik Koltuk Köşesi'
    ],
    descriptions: [
      'Doğal ışık alan modern bir odada çekilmiş, el yapımı seramik kahve kupası ve şık ahşap sunum tepsisi. Ev dekorasyon ve sakin yaşam konsepti.',
      'Toprak tonlarında mat seramik saksı içerisinde kurutulmuş pampas otu ve keten detaylı arka plan. Minimalist iç mekan tasarımı ve sıcak atmosfer.',
      'Sakinleştirici aromaterapi etkili el yapımı soya mumu, mermer sunum tepsisi üzerinde yanarken. Estetik spa ve evde kişisel bakım teması.',
      'Doğal keten kumaştan üretilmiş bej rengi minder, ahşap mobilya üzerinde estetik ve rahat bir köşe oluştururken. Sıcak İskandinav ev stili.'
    ],
    keywords: [
      'ev dekorasyonu, seramik kupa, minimalist yaşam, iskandinav tarzı, kahve keyfi, el yapımı seramik, ahşap tepsi, doğal yaşam, estetik oda, bohem dekorasyon, toprak tonları, sakin atmosfer, kurutulmuş çiçekler, soya mumu, mermer tepsi, keten minder, rustik stil, sıcak yuva, ev tekstili, el emeği'
    ],
    ecommerce: {
      title: 'El Yapımı Seramik Kahve Kupası | Özel Tasarım Kupa Bardak | Hediye Kupa Bardak - Minimalist İskandinav Serisi',
      description: `✨ Evinize ve kahve saatlerinize estetik katacak tamamen el yapımı seramik kupa.
      
• Malzeme: Yüksek kaliteli stoneware kil ve gıdaya uygun mat sır.
• Hacim: Yaklaşık 320 ml.
• Kullanım: Bulaşık makinesinde yıkanabilir ancak el yapımı ürünlerin uzun ömürlü olması için elde yıkama önerilir.
• Hediye Seçeneği: Şık kraft kutusunda, korumalı ambalajıyla gönderilir. Doğum günü, yeni ev hediyesi veya kendiniz için harika bir tercihtir.
      
Not: Her ürün el yapımı olduğu için form ve sır dağılımlarında hafif farklılıklar bulunabilir, bu da her kupayı benzersiz kılar.`,
      tags: 'seramik kupa, el yapimi kupa, kahve kupasi, tasarim kupa, hediye bardak, mutfak dekoru, iskandinav kupa, kahve fincani, el yapimi seramik, dogal kupa, hediye fikirleri, kahve sever, estetik bardak'
    }
  },
  cosmetics: {
    name: 'Kozmetik & Güzellik',
    titles: [
      'Cam Şişede Nemlendirici Cilt Bakım Serumu ve Damlalık',
      'Organik Bileşenli Yüz Kremi ve Ahşap Spatula',
      'Doğal Kil Maskesi ve Ekolojik Bambu Fırça',
      'Yumuşak Işıkta Kozmetik Yağ Şişesi ve Gül Yaprakları'
    ],
    descriptions: [
      'Temiz içerikli nemlendirici yüz serumu, şeffaf cam şişesi ve damlalığı ile minimalist bir arka planda. Lüks cilt bakımı ve güzellik rutini.',
      'Ahşap spatulası ile mat cam kavanozda sunulan besleyici organik gece kremi. Doğal güzellik ve wellness konseptli ürün fotoğrafı.',
      'Seramik kase içerisinde hazırlanmış yeşil kil maskesi ve bambu uygulama fırçası. Cilt arındırma, detoks ve spa salonu teması.',
      'Cam damlalıklı şişede bitkisel masaj yağı ve etrafında taze pembe gül yaprakları. Aromaterapi, gevşeme ve doğal kozmetik ürün çekimi.'
    ],
    keywords: [
      'cilt bakımı, yüz serumu, kozmetik şişesi, organik güzellik, doğal kozmetik, cam damlalık, nemlendirici serum, spa ve wellness, temiz içerik, cilt bakımı rutini, güzellik ürünü, masaj yağı, kil maskesi, organik krem, bambu fırça, aromaterapi, bitkisel yağ, lüks kozmetik, pürüzsüz cilt, kişisel bakım'
    ],
    ecommerce: {
      title: 'Organik Nemlendirici Cilt Bakım Serumu | %100 Doğal Hyalüronik Asit & Vegan Yüz Serumu - Anti-Aging Parıltı',
      description: `🌿 Cildinizin ihtiyacı olan yoğun nemi ve ışıltıyı doğal yollarla geri kazanın.
      
• İçerik: Hyalüronik Asit, Aloe Vera Ekstratı, Organik Gül Suyu ve Vitamin E. 
• Etki: Cildin alt katmanlarına nüfuz ederek ince çizgileri dolgunlaştırır, yoğun nem bariyeri oluşturur.
• Kullanım: Temizlenmiş yüz ve boyun bölgesine günde iki kez 3-4 damla masaj yaparak uygulayın.
• Özellikler: Paraben, sülfat, parfüm ve yapay renklendirici içermez. Hayvanlar üzerinde test edilmemiştir (Cruelty-Free).
      
Hacim: 30ml damlalıklı kehribar cam şişe.`,
      tags: 'yuz serumu, cilt bakimi, organik serum, dogal kozmetik, nemlendirici, hyaluronik asit, vegan kozmetik, anti aging, temiz icerik, pariltili cilt, gozenek sikilastirici, hediye kozmetik, leke karsiti'
    }
  },
  tech: {
    name: 'Teknoloji & Aksesuar',
    titles: [
      'Zarif Tasarımlı Kablosuz Kulak Üstü Bluetooth Kulaklık',
      'Mat Siyah Akıllı Saat ve Manyetik Şarj Ünitesi',
      'Minimalist Çalışma Masasında Metalik Dizüstü Bilgisayar',
      'İnce Tasarımlı Akıllı Telefon ve Kablosuz Şarj Standı'
    ],
    descriptions: [
      'Gelişmiş gürültü engelleme özelliğine sahip, mat gri premium kablosuz kulaküstü kulaklık. Temiz ve şık stüdyo arka planında teknoloji ürünü çekimi.',
      'Sağlık takibi ve spor modları aktif olan mat siyah paslanmaz çelik akıllı saat, minimalist standı üzerinde. Modern giyilebilir teknoloji detayı.',
      'Alüminyum gövdeli ince dizüstü bilgisayar, şık bir çalışma masası düzeninde kapalı halde dururken. Home office ve verimlilik konsepti.',
      'Üç kameralı lüks akıllı telefon, yanık turuncu tonlarında deri kılıfı ile dikey kablosuz şarj ünitesinde dururken. Mobil teknoloji ve aksesuar.'
    ],
    keywords: [
      'akıllı saat, kablosuz kulaklık, bluetooth kulaklık, giyilebilir teknoloji, akıllı telefon, dizüstü bilgisayar, teknoloji aksesuarı, mat siyah, metalik tasarım, minimalist çalışma masası, home office, premium kulaklık, kablosuz şarj, telefon kılıfı, verimlilik, ses sistemleri, spor saati, deri kılıf, modern ofis, lüks teknoloji'
    ],
    ecommerce: {
      title: 'Premium Aktif Gürültü Engelleyici (ANC) Kablosuz Bluetooth Kulaklık | 40 Saat Çalma Süreli Kulak Üstü Kulaklık - Mat Siyah',
      description: `🎧 Dış dünyayı sessize alın ve müziğin derinliklerine odaklanın.
      
• Ses Kalitesi: Hi-Res Audio sertifikalı, 40mm dinamik sürücüler ile derin bas ve kristal netliğinde tizler.
• Aktif Gürültü Engelleme (ANC): Dış sesleri %90'a varan oranda bloke eder.
• Pil Ömrü: Tek şarjla ANC açıkken 30 saat, ANC kapalıyken 40 saate varan kullanım. Type-C hızlı şarj desteği (10 dk şarj ile 4 saat dinleme).
• Bağlantı: Bluetooth 5.2 ile gecikmesiz ve stabil bağlantı. Çok noktalı bağlantı sayesinde aynı anda iki cihaza bağlanabilir.
      
Paket İçeriği: Premium Seyahat Çantası, Type-C Şarj Kablosu, 3.5mm Aux Kablosu ve Kullanım Kılavuzu.`,
      tags: 'bluetooth kulaklik, kablosuz kulaklik, gürültü engelleyici, anc kulaklik, siyah kulaklik, muzik kulakligi, oyuncu kulakligi, teknoloji hediye, seyahat kulakligi, yuksek ses kalitesi, kulakustu kulaklik, premium ses'
    }
  },
  food: {
    name: 'Yiyecek & İçecek',
    titles: [
      'Taze Çekilmiş Kahve Çekirdekleri ve Kahve Demleme Ekipmanı',
      'Karanlık Arka Planda Sızma Zeytinyağı Şişesi ve Biberiye',
      'Ahşap Tahtada Taze Pişmiş Ekşi Mayalı Ekmek Dilimleri',
      'Cam Bardakta Buzlu Hibiskus Çayı ve Taze Nane Yaprakları'
    ],
    descriptions: [
      'Pour-over (V60) yöntemiyle taze demlenen filtre kahve süzülürken etrafındaki kavrulmuş kahve çekirdekleri. Nitelikli kahve kültürü fotoğrafı.',
      'Rustik koyu renkli ahşap masada, koyu yeşil cam şişe içerisinde ev yapımı soğuk sıkım sızma zeytinyağı ve taze kekik, biberiye dalları.',
      'Fırından yeni çıkmış, çıtır kabuklu, içi gözenekli organik ekşi mayalı ekmek. Keten bez üzerinde rustik fırıncılık sanatı çekimi.',
      'Yaz aylarında ferahlatıcı kırmızı hibiskus çayı, şeffaf cam bardakta eriyen buz küpleri ve taze yeşil nane ile. Doğal soğuk içecek konsepti.'
    ],
    keywords: [
      'filtre kahve, kahve çekirdeği, zeytinyağı, organik gıda, ekşi mayalı ekmek, fırıncılık, soğuk içecek, hibiskus çayı, rustik yemek çekimi, taze baharatlar, soğuk sıkım, organik zeytinyağı, v60 demleme, nitelikli kahve, kahve dükkanı, sağlıklı beslenme, el yapımı ekmek, taze nane, buzlu çay, gurme lezzetler'
    ],
    ecommerce: {
      title: 'Ege Esintisi Soğuk Sıkım Sızma Zeytinyağı | %100 Organik Erken Hasat Zeytinyağı - 500 ml Şık Cam Şişe',
      description: `🌿 Ege'nin asırlık zeytin ağaçlarından erken hasat edilen zeytinlerin, soğuk sıkım yöntemiyle sıkılmasıyla elde edilen üstün kaliteli sızma zeytinyağı.
      
• Hasat Zamanı: Ekim - Kasım ayları (Erken hasat, yeşil zeytinlerden).
• Asitlik Derecesi: Maksimum %0.3 oleik asit oranı (Ultra düşük asit).
• Üretim Yöntemi: 22°C altında soğuk sıkım uygulanarak zeytindeki polifenol ve antioksidan değerleri en üst düzeyde korunmuştur.
• Lezzet Profilui: Taze biçilmiş çimen, yeşil elma ve domates yaprağı aromalarıyla zengin, boğazda hafif yakıcılık bırakan meyvemsi tat.
      
Salatalarınız, mezeleriniz ve soğuk yemekleriniz için mükemmel bir gurme dokunuş.`,
      tags: 'sizma zeytinyagi, soguk sikim, erken hasat, organik zeytinyagi, gurme lezzet, dogal yag, ege zeytinyagi, salata yagi, saglikli beslenme, cam sise yag, hediye zeytinyagi, premium zeytinyagi, hakiki zeytinyagi'
    }
  },
  landscape: {
    name: 'Doğa & Manzara',
    titles: [
      'Sis Altındaki Çam Ormanı ve Dumanlı Dağ Zirveleri',
      'Gün Batımında Dalgalı Deniz ve Altın Rengi Yansımalar',
      'Sonbaharda Altın Sarısı Yapraklarla Kaplı Orman Yolu',
      'Yıldızlı Gökyüzü Altında Karlı Kamp Çadırı'
    ],
    descriptions: [
      'Sabahın erken saatlerinde sis tabakası ile kaplanmış görkemli dağ sırası ve sık çam ağaçları. Doğu Karadeniz yaylalarında vahşi doğa ve macera.',
      'Akşam güneşinin batışında, köpüklü okyanus dalgalarının kumsala vururken yarattığı altın renkli ışık yansımaları. Huzurlu doğa ve tatil teması.',
      'Sonbaharın sıcak renklerini barındıran sarı ve turuncu yaprakların döküldüğü, derinlere uzanan patika orman yolu. Dinginlik ve mevsim geçişi.',
      'Kış kampı konseptinde, berrak gökyüzündeki Samanyolu galaksisinin altında içten aydınlatılmış turuncu kamp çadırı. Macera ve outdoor sporları.'
    ],
    keywords: [
      'çam ormanı, sisli dağlar, karadeniz yaylası, gün batımı, deniz dalgaları, altın saat, sonbahar yaprakları, orman yolu, kış kampı, kamp çadırı, samanyolu, yıldızlı gökyüzü, vahşi doğa, manzara fotoğrafı, outdoor macera, seyahat rotaları, dinginlik, seyahat günlüğü, dağ tırmanışı, doğa yürüyüşü'
    ],
    ecommerce: {
      title: 'Sisli Çam Ormanı Manzaralı Premium Duvar Posteri | Büyük Boy Doğa Temalı Tablo - Sanatsal Çerçeveli Baskı',
      description: `🌲 Evinizin veya ofisinizin havasını değiştirecek, doğanın huzurunu duvarlarınıza taşıyacak özel sanatsal fotoğraf baskısı.
      
• Baskı Kalitesi: 250gr müze kalitesinde asitsiz mat fine art kağıdına ultra-yüksek çözünürlüklü baskı.
• Çerçeve Detayı: Minimalist mat siyah ahşap çerçeve ve kırılmaya dayanıklı yüksek şeffaflıkta pleksiglas koruma.
• Askı Aparatı: Arkasında hazır monte edilmiş çelik askı teli ile asılmaya hazır gönderilir.
• Ölçü Seçenekleri: 35x50 cm, 50x70 cm, 70x100 cm.
      
Tüm gönderilerimiz kırılmaya karşı garantili, özel korumalı ahşap sandık kutularda yapılmaktadır.`,
      tags: 'duvar posteri, doga tablosu, cerceveli tablo, orman posteri, minimalist tablo, fine art baski, ev hediyesi, salon dekoru, büyük boy poster, sanatsal fotograf, manzara tablosu, modern cerceve, ofis tablosu'
    }
  },
  fashion: {
    name: 'Moda & Giyim',
    titles: [
      'Stüdyoda Modern Kot Ceket ve Beyaz Tişört Kombini',
      'Sokak Stilinde Şık Kadın Güneş Gözlüğü ve Trençkot',
      'Retro Tarzı Deri Çizme ve Dokuma Çanta Detayı',
      'Pastel Tonlarda Yazlık Şapka ve Keten Elbise'
    ],
    descriptions: [
      'Minimalist stüdyo ışığında, yeni sezon denim ceket ve spor şıklık konseptli giyim fotoğrafı.',
      'Güneşli bir günde şehir merkezinde yürüyen, şık güneş gözlüğü ve klasik trençkotuyla stil sahibi bir kadın.',
      'Eski sokak kaldırımlarında retro tarzı kahverengi deri çizmeler ve omuzda el dokuması keten çanta.',
      'Kumsalda veya yaz partisinde giyilebilecek, hasır şapka ve uçuşan bej keten elbise detayı.'
    ],
    keywords: [
      'moda giyim, kot ceket, sokak stili, trençkot, güneş gözlüğü, yeni sezon, stüdyo çekimi, retro giyim, deri çizme, el dokuması çanta, yazlık elbise, keten kumaş, hasır şapka, stil kombin, şık giyim, genç tarzı, sonbahar modası, tekstil ürünü, gardırop, günlük şıklık'
    ],
    ecommerce: {
      title: 'Unisex Oversize Denim Ceket | Yeni Sezon Premium Kot Ceket - Klasik Mavi',
      description: `🧥 Gardırobunuzun kurtarıcı parçası olacak, zamansız tasarıma sahip premium kot ceket.
      
• Kumaş: %100 pamuklu denim, dayanıklı ve nefes alabilir doku.
• Kalıp: Modern oversize kesim, her bedene uyumlu kalıp.
• Detay: Metal paslanmaz düğmeler ve fonksiyonel 4 adet cep.
• Yıkama: 30 derecede tersten yıkayınız.
      
Hem spor hem de şık kombinleriniz için mükemmel bir tamamlayıcıdır.`,
      tags: 'kot ceket, denim ceket, oversize ceket, unisex ceket, mavi ceket, spor mont, yeni sezon giyim, sokak modasi, premium denim, pamuklu ceket, trend ceket, hediye giyim, jean ceket'
    }
  },
  fitness: {
    name: 'Spor & Sağlıklı Yaşam',
    titles: [
      'Yoga Matı Üzerinde Egzersiz Yapan Kadın ve Spor Matarası',
      'Koşu Pistinde Koşu Ayakkabısı Detayı ve Akşam Üstü Işığı',
      'Fitness Salonunda Çelik Dambıllar ve Ter Havlusu',
      'Doğal Ahşap Masada Detoks Smoothie ve Taze Meyveler'
    ],
    descriptions: [
      'Sakin bir stüdyoda, yeşil yoga matı üzerinde egzersiz hareketleri yapan sporcu kadın ve yanında çelik matara.',
      'Gün batımına yakın saatte parkurdaki koşucunun spor ayakkabıları ve dinamik hareket anı.',
      'Profesyonel fitness salonunda ağırlık sehpası üzerinde duran krom kaplı dambıllar ve mikrofiber havlu.',
      'Cam şişede yeşil ıspanak ve muz smoothie, etrafında taze kesilmiş kivi ve chia tohumları.'
    ],
    keywords: [
      'sağlıklı yaşam, yoga matı, sporcu matarası, egzersiz, koşu ayakkabısı, spor salonu, dambıl ağırlık, detoks smoothie, yeşil içecek, chia tohumu, sporcu beslenmesi, kardiyo, fitness antrenmanı, pilates, sağlıklı beslenme, aktif yaşam, ter havlusu, motivasyon, sabah sporu, esneme hareketleri'
    ],
    ecommerce: {
      title: 'Çift Renkli Kaydırmaz TPE Yoga ve Pilates Matı | 6mm Kalınlık Spor Matı - Ekolojik ve Dayanıklı',
      description: `🧘‍♀️ Egzersizlerinizi daha konforlu ve güvenli hale getirecek, yüksek yoğunluklu kaydırmaz yoga matı.
      
• Malzeme: Çevre dostu, geri dönüştürülebilir TPE (Lateks ve PVC içermez).
• Kalınlık: 6mm optimum kalınlık ile eklemlerinizi korur ve dengeyi kolaylaştırır.
• Dokusu: Çift taraflı kaymaz özel dokulu yüzey, terleme durumunda dahi tam tutuş sağlar.
• Boyut: 183 cm x 61 cm.
• Taşıma: Kolay taşıma askısı ve özel kılıfı ile birlikte gönderilir.
      
Yoga, pilates, fitness ve ev egzersizleri için idealdir.`,
      tags: 'yoga mati, pilates mati, spor mati, kaydirmaz mat, egzersiz mati, evde spor, fitness ekipmani, tpe mat, saglikli yasam, pilates malzemesi, mavi mat, spor hediye, dayanikli mat'
    }
  },
  business: {
    name: 'İş Dünyası & Ofis',
    titles: [
      'Modern Toplantı Odasında Beyaz Tahta ve Çalışanlar',
      'Ofis Masasında Tasarımcı Çizim Tableti ve Not Defteri',
      'Finansal Grafik Analizi Yapan Analist ve Hesap Makinesi',
      'Cam Arkasında Beyin Fırtınası Yapan Genç Ekip'
    ],
    descriptions: [
      'Geniş pencereli aydınlık bir toplantı odasında beyin fırtınası yapan, beyaz tahtaya notlar alan profesyonel ekip.',
      'Grafik tasarımcının masasında çizim tableti, dokunmatik kalem ve üzerine kahve fincanı konmuş şık bir not defteri.',
      'Işıklı bir ortamda açık renkli kağıtlara basılmış bütçe ve satış grafiklerini analiz eden uzman.',
      'Ofisin cam bölmesine renkli yapışkan notlar asarak yeni projeyi planlayan genç girişimci ekibi.'
    ],
    keywords: [
      'iş dünyası, toplantı odası, beyin fırtınası, ofis masası, grafik tablet, çizim kalemi, finansal analiz, satış grafiği, genç girişimciler, yapışkan notlar, iş birliği, ofis ortamı, kurumsal hayat, kariyer, modern ofis, planlama toplantısı, iş yönetimi, veri analizi, dijital tasarım, ekip çalışması'
    ],
    ecommerce: {
      title: 'Akıllı Deri Sümen ve Ofis Masası Düzenleyici | Premium Deri Klavye Fare Altlığı - Büyük Boy Kahverengi',
      description: `💼 Ofis masanıza lüks ve düzen getirecek, birinci sınıf el yapımı deri sümen.
      
• Malzeme: %100 birinci kalite suni deri (kolay temizlenir, sıvı geçirmez).
• Ölçü: 80 cm x 40 cm geniş yüzey alanı (klavye, fare ve laptopu rahatça alır).
• Koruma: Masanızı çizilmelere, lekelere ve ısıya karşı mükemmel korur.
• Alt Yüzey: Kaymaz süet alt zemin sayesinde masaya tam oturur.
      
Çalışma alanınızı şık ve işlevsel bir ofise dönüştürün.`,
      tags: 'deri sumen, masa duzenleyici, ofis aksesuari, fare altligi, mouse pad buyuk, calisma masasi, hediye ofis, kurumsal hediye, kahverengi sumen, şık ofis, home office aksesuari, laptop matı, tasarim ofis'
    }
  },
  architecture: {
    name: 'Mimari & Yapı',
    titles: [
      'Gökdelen Camından Şehir Manzarası ve Geometrik Yapılar',
      'Modern Müze Binasının Spiral Merdivenleri ve Işık Oyunu',
      'Loft Tarzı Ev İçinde Tuğla Duvar ve Çelik Kirişler',
      'Tarihi Taş Konağın Ahşap Pencereleri ve Sarmaşıklar'
    ],
    descriptions: [
      'Modern mimariye sahip gökdelenlerin birbirine yansıyan cam yüzeyleri ve yukarı doğru çekilmiş geometrik kadraj.',
      'Sanat müzesinin betonarme mimarisindeki devasa spiral merdivenler ve yukarıdan süzülen doğal gün ışığı.',
      'Yüksek tavanlı loft dairede endüstriyel esintili tuğla duvar kaplaması, siyah metal detaylar ve sarkıt lambalar.',
      'Geleneksel mimariye uygun restore edilmiş taş evin, kemerli ahşap pencereleri etrafını saran yeşil sarmaşıklar.'
    ],
    keywords: [
      'modern mimari, gökdelenler, geometrik yapılar, spiral merdivenler, müze binası, iç mekan tasarımı, loft daire, tuğla duvar, endüstriyel tasarım, taş konak, ahşap pencere, sarmaşıklar, betonarme, ışık yansıması, kentsel doku, restorasyon, bina cephesi, minimal mimari, mimari detay, sanat galerisi'
    ],
    ecommerce: {
      title: '3D Tuğla Desenli Kendinden Yapışkanlı Duvar Paneli | Isı ve Ses Yalıtımlı Dekoratif Duvar Kağıdı - 10 Adet Paket',
      description: `🧱 Usta çağırmadan, kendi başınıza evinizin havasını değiştirebileceğiniz yapışkanlı dekoratif panel.
      
• Malzeme: Yumuşak polietilen köpük (darbelere karşı koruyucudur, çocuk odalarına uygundur).
• Özellik: Suya, neme ve ısıya dayanıklıdır. Kolayca silinebilir.
• Uygulama: Arkasındaki koruyucu bandı çıkarıp temiz duvara yapıştırmanız yeterlidir. Makasla kolayca kesilebilir.
• Boyut: Her bir panel 70 cm x 77 cm ölçülerindedir.
      
Salon, mutfak, koridor veya ofis duvarlarında modern tuğla görünümü elde etmek için en pratik çözümdür.`,
      tags: 'duvar paneli, yapiskanli panel, tugla desenli, duvar kagidi, ev dekorasyon, yalitimli panel, pratik dekorasyon, salon duvari, 3d duvar kagidi, kopuk panel, kendin yap duvar, beyaz tugla, dekoratif kaplama'
    }
  },
  animals: {
    name: 'Evcil Hayvanlar & Vahşi Yaşam',
    titles: [
      'Pencere Kenarında Güneşlenen Sevimli Tekir Kedi',
      'Parkta Koşan Golden Retriever Köpek ve Islak Burun',
      'Akvaryumda Süzülen Parlak Turuncu Japon Balığı',
      'Daldaki Yeşil Muhabbet Kuşu ve Renkli Tüyler'
    ],
    descriptions: [
      'Güneş ışığının vurduğu pencere eşiğinde uzanmış, yeşil gözlü sevimli bir tekir kedi.',
      'Yeşillikler içinde dili dışarıda koşan, mutlu ve enerjik bir Golden Retriever cinsi köpek.',
      'Akvaryum bitkileri arasında süzülen, pulları parıldayan sevimli turuncu süs balığı.',
      'Kafes dışında veya doğal ortamında, ahşap tünekte dik duran canlı sarı-yeşil muhabbet kuşu.'
    ],
    keywords: [
      'evcil hayvan, tekir kedi, sevimli kedi, kedi gözleri, golden retriever, mutlu köpek, köpek eğitimi, japon balığı, akvaryum bitkileri, muhabbet kuşu, renkli tüyler, hayvan sevgisi, veterinerlik, kedi maması, köpek oyuncağı, evde kedi besleme, evcil hayvan bakımı, doğa ve hayvanlar, tatlı pati, patili dostlar'
    ],
    ecommerce: {
      title: 'Ortopedik Yatıştırıcı Peluş Kedi ve Köpek Yatağı | Yıkanabilir Pofuduk Yuvarlak Evcil Hayvan Yatağı - Gri (60cm)',
      description: `🐱 Evcil dostlarınızın en rahat ve derin uykularını çekmesi için tasarlanmış, ultra yumuşak peluş yatak.
      
• Malzeme: Birinci sınıf pofuduk peluş kumaş ve içi dolgulu antibakteriyel boncuk elyaf.
• Tasarım: Yuvarlak simit tasarımı sayesinde kediniz veya köpeğiniz kendini güvende ve sarılmış hisseder.
• Taban: Kaymaz ve su geçirmez alt taban ile zeminlerde sabit durur.
• Temizlik: Çamaşır makinesinde 30 derecede hassas programda yıkanabilir.
• Boyut: 60 cm çap (küçük ve orta boy kedi-köpekler için idealdir).
      
Dostunuzun eklem ağrılarını hafifletmeye yardımcı olur ve stresi azaltır.`,
      tags: 'kedi yatagi, kopek yatagi, pelus yatak, evcil hayvan yatagi, pofuduk yatak, ortopedik yatak, kedi yuvasi, kopek yuvasi, yikanabilir yatak, kedi malzemesi, gri yatak, evcil hayvan aksesuari, rahat uyku'
    }
  },
  travel: {
    name: 'Seyahat & Kültür',
    titles: [
      'Eski Şehir Sokaklarında Renkli Evler ve Arnavut Kaldırımı',
      'Dağ Eteğindeki Tarihi Kale ve Yemyeşil Vadi Manzarası',
      'Baharat Pazarında Çuvallardaki Renkli Egzotik Baharatlar',
      'Sırt Çantalı Gezginin Harita ve Pusula ile Yol Bulması'
    ],
    descriptions: [
      'Tarihi mahallede, iki yanında pastel tonlarda boyanmış pencereli evler bulunan taş döşeli eski sokak.',
      'Sarp kayalıkların üzerine inşa edilmiş görkemli tarihi kale kalıntıları ve aşağıda uzanan nehir vadisi.',
      'Geleneksel çarşıda yan yana dizilmiş çuvallarda kırmızı pul biber, sarı zerdeçal, kakule ve tarçın kabukları.',
      'Seyahat halindeki bir turistin ahşap masa üzerinde dünya haritası ve pirinç pusula yardımıyla rotasını çizmesi.'
    ],
    keywords: [
      'seyahat, eski şehir, renkli evler, arnavut kaldırımı, tarihi kale, yeşil vadi, baharat pazarı, egzotik baharatlar, sırt çantalı gezgin, dünya haritası, pusula, turizm, tatil rotası, tarih ve kültür, gezi günlüğü, macera seyahati, kültürel miras, eski sokaklar, kaşif, fotoğraf gezisi'
    ],
    ecommerce: {
      title: 'Su Geçirmez Çok Fonksiyonlu Seyahat Sırt Çantası | USB Şarj Girişli Geniş Hacimli Valiz Çanta - Unisex Siyah',
      description: `✈️ Seyahatlerinizde, iş gezilerinizde veya günlük hayatta tüm eşyalarınızı düzenli tutacak akıllı sırt çantası.
      
• Malzeme: Yüksek yoğunluklu suya dayanıklı oxford kumaş.
• Bölmeler: 15.6 inç özel korumalı laptop bölmesi, ıslak/kuru eşya ayırma cebi ve gizli pasaport gözü.
• Şarj Portu: Dahili USB bağlantı noktası ile yürürken telefonunuzu kolayca şarj edin (powerbank içeride kalır).
• Ergonomi: Nefes alabilen file sırt desteği ve valiz askı kemeri ile konforlu taşıma.
• Boyut: 45 cm x 30 cm x 20 cm (kabin boy ölçülerine uygundur).
      
Hafta sonu kaçamakları ve uzun seyahatler için vazgeçilmez bir yardımcıdır.`,
      tags: 'seyahat cantasi, sirt cantasi, laptop cantasi, kabin boy canta, su gecirmez canta, usbli canta, valiz canta, siyah sirt cantasi, unisex canta, dagci cantasi, kamp cantasi, seyahat ekipmanlari, hediye canta'
    }
  },
  automotive: {
    name: 'Otomotiv & Taşıtlar',
    titles: [
      'Gece Şehir Işıklarında Spor Arabanın Ön Izgarası ve Farları',
      'Tozlu Yolda İlerleyen Off-Road Arazi Aracı ve Çamur Detayı',
      'Klasik Kırmızı Motosiklet ve Deri Kask Detayı',
      'Güneş Batımında Boş Otobanda Hızla İlerleyen Araba'
    ],
    descriptions: [
      'Gece saatlerinde neon ışıkların yansıdığı, keskin hatlı lüks spor otomobilin mercekli LED farları.',
      'Dağlık arazide çamurlu su birikintisinden hızla geçerek su fışkırtan 4x4 arazi aracının dinamik anı.',
      'Garajda veya sahil yolunda park edilmiş, parıldayan krom aksamlı vintage motosiklet ve gidonda deri kask.',
      'Ufuk çizgisinde batan güneşin turuncu ışığı altında, uzun otobanda kaybolan modern binek araç.'
    ],
    keywords: [
      'otomotiv, spor araba, led farlar, lüks otomobil, off-road, arazi aracı, 4x4, çamurlu yol, klasik motosiklet, vintage motor, deri kask, otoban, gün batımı sürüşü, otomobil tasarımı, hız tutkusu, sürüş keyfi, araba modifiyesi, araç bakımı, motor aksesuarları, yol manzarası'
    ],
    ecommerce: {
      title: 'Yüksek Çözünürlüklü Gece Görüşlü Araç İçi Kamera | Full HD 1080P G-Sensörlü Oto Yol Kayıt Cihazı - 170 Derece Açı',
      description: `🚗 Sürüş güvenliğinizi en üst duyeye çıkaran, kaza anını otomatik kilitleyen akıllı araç kamerası.
      
• Çözünürlük: Real 1080P Full HD kayıt kalitesi ile plaka ve detayları net yakalar.
• Görüş Açısı: 170 derece ultra geniş açı sayesinde şeritlerin tamamını görüntüler.
• Gece Görüşü: WDR teknolojisi ile gece ve düşük ışıkta yüksek kaliteli görüntü kaydeder.
• G-Sensör: Olası sarsıntı veya kaza anında video kaydını kilitler, üzerine yazılmasını engeller.
• Döngüsel Kayıt: Hafıza kartı dolduğunda en eski kilitlenmemiş videoların üzerine otomatik yazar.
      
Kurulumu kolay vantuzlu standı ve araç şarj kiti ile birlikte eksiksiz gelir.`,
      tags: 'arac kamerasi, oto kamera, yol kayit cihazi, hd kamera, gece goruslu kamera, arac ici aksesuarlar, g sensorlu kamera, kaza kamerasi, oto elektronik, guvenli surus, 1080p kamera, araba kamerasi'
    }
  },
  portrait: {
    name: 'İnsanlar & Portre',
    titles: [
      'Açık Havada Gülen Genç Kadının Portre Fotoğrafı',
      'Kitap Okuyan Yaşlı Adamın Düşünceli Yüz İfadesi',
      'Birlikte Gülen Aile ve Çocukların Parktaki Mutluluğu',
      'Doğal Işıkta Çalışan Zanaatkarın Odaklanmış Elleri'
    ],
    descriptions: [
      'Arka planı bulanık (bokeh etkili), gün ışığında kameraya samimi bir gülümsemeyle bakan genç kadın portresi.',
      'Kütüphanede veya evinde, gözlüğü burnunun ucunda elindeki eski kitabı okuyan bilge yaşlı adam portresi.',
      'Güneşli bir günde çimler üzerinde uzanmış, birbirine sarılarak kahkaha atan anne, baba ve çocuk.',
      'Atölyesinde kil çömleğe şekil verirken veya ahşap oyarken zanaatkarın detaylı el hareketleri ve alın teri.'
    ],
    keywords: [
      'insan portresi, gülen kadın, açık hava çekimi, bokeh arka plan, yaşlı adam, kitap okuma, aile mutluluğu, çocuk gülüşü, parkta piknik, zanaatkar elleri, odaklanma, samimi ifade, insan duyguları, yaşam tarzı, günlük yaşam, portre fotoğrafçılığı, doğal ışık, atölye çalışma, anne cocuk, mutlu anlar'
    ],
    ecommerce: {
      title: 'Taşınabilir LED Halka Işık ve Tripod Seti | TikTok ve YouTube Canlı Yayın Lambası - 3 Renk Modu 10 Seviye Parlaklık',
      description: `📸 Profesyonel portre çekimleri, makyaj videoları ve canlı yayınlar için ideal halka ışık standı.
      
• Işık Çapı: 10 inç (26 cm) LED halka ışık.
• Renk Modları: Sıcak Sarı, Doğal Beyaz, Soğuk Beyaz olmak üzere 3 farklı renk tonu.
• Parlaklık: Her renk modu için 10 kademeli parlaklık ayarı (Toplam 30 farklı ışık kombinasyonu).
• Tripod Standı: Ayarlanabilir yükseklik (50 cm - 160 cm arası) ve 360 derece dönebilen telefon tutucu başlık.
• Bağlantı: USB kablosu ile bilgisayara, powerbanke veya priz adaptörüne bağlanarak çalışır.
      
Fotoğraf ve video çekimlerinizde gölgeleri yok eder, gözlerde estetik halka yansıması oluşturur.`,
    }
  },
  other: {
    name: 'Diğer / Genel',
    titles: [
      'Stüdyo Işığında Minimalist Nesne Çekimi',
      'Renkli Soyut Desen ve Doku Detayı',
      'Modern Arka Planda Profesyonel Ürün Çekimi',
      'Yaratıcı Konsept Fotoğrafı ve Derinlik'
    ],
    descriptions: [
      'Minimalist ve temiz bir stüdyo ortamında çekilmiş, profesyonel ürün veya konsept fotoğrafı.',
      'Canlı renklere ve estetik geçişlere sahip, tasarım projelerinde kullanılabilecek soyut arka plan dokusu.',
      'Modern ve şık bir arka plan önünde, detayları ön plana çıkarılmış yüksek kaliteli nesne fotoğrafı.',
      'Yaratıcı fikirleri ve sanatsal bakış açısını yansıtan, derinlik algısı yüksek konsept stüdyo çekimi.'
    ],
    keywords: [
      'minimalist çekim, stüdyo fotoğrafı, ürün çekimi, soyut desen, renkli doku, profesyonel fotoğrafçılık, yüksek kalite, konsept tasarımı, sanatsal bakış, modern arka plan, estetik görsel, nesne çekimi, yaratıcı konsept, tasarım elementi, parlak renkler, yumuşak ışık, detay çekimi, stok görsel, ticari kullanım, derinlik hissi'
    ],
    ecommerce: {
      title: 'Özel Tasarım Ürün | Çok Amaçlı Premium Tasarım Objesi',
      description: `✨ Hayatınıza estetik ve işlevsellik katacak, yüksek kaliteli malzemelerle üretilmiş özel tasarım ürün.
      
• Tasarım: Modern, şık ve minimalist çizgilere sahip benzersiz görünüm.
• Malzeme: Birinci sınıf kaliteli ve uzun ömürlü hammadde kullanımı.
• Kullanım: Evinizde, ofisinizde veya günlük hayatınızda çok amaçlı kullanıma uygun.
• Hediye: Özel ambalajlı kutusuyla sevdikleriniz için harika bir hediye alternatifi.
      
Tarzınızı yansıtacak detaylarla bezeli bu ürün, mekanınıza modern bir dokunuş kazandıracak.`,
      tags: 'tasarim urun, premium kalite, ozel tasarim, ev aksesuari, ofis aksesuari, cok amacli urun, hediye fikirleri, modern tasarim, estetik objeler, kaliteli urun, tasarim objesi, şık hediye, minimalist tarz'
    }
  }
};

export function getCategories() {
  return Object.keys(CATEGORY_TEMPLATES).map(key => ({
    key: key,
    name: CATEGORY_TEMPLATES[key].name
  }));
}

export function detectCategoryFromFilename(filename) {
  if (!filename) return 'other';
  const lowerFn = filename.toLowerCase();
  if (lowerFn.includes('kahve') || lowerFn.includes('kupa') || lowerFn.includes('vazo') || lowerFn.includes('mum') || lowerFn.includes('pillow') || lowerFn.includes('decor') || lowerFn.includes('yasam')) {
    return 'decor';
  } else if (lowerFn.includes('serum') || lowerFn.includes('krem') || lowerFn.includes('maske') || lowerFn.includes('yag') || lowerFn.includes('rose') || lowerFn.includes('skin') || lowerFn.includes('beauty') || lowerFn.includes('kozmetik')) {
    return 'cosmetics';
  } else if (lowerFn.includes('kulaklik') || lowerFn.includes('saat') || lowerFn.includes('phone') || lowerFn.includes('watch') || lowerFn.includes('laptop') || lowerFn.includes('tech') || lowerFn.includes('aksesuar')) {
    return 'tech';
  } else if (lowerFn.includes('yemek') || lowerFn.includes('oil') || lowerFn.includes('ekmek') || lowerFn.includes('coffee') || lowerFn.includes('food') || lowerFn.includes('tea') || lowerFn.includes('icecek')) {
    return 'food';
  } else if (lowerFn.includes('doga') || lowerFn.includes('sunset') || lowerFn.includes('forest') || lowerFn.includes('landscape') || lowerFn.includes('manzara') || lowerFn.includes('mountain')) {
    return 'landscape';
  } else if (lowerFn.includes('elbise') || lowerFn.includes('ceket') || lowerFn.includes('giyim') || lowerFn.includes('fashion') || lowerFn.includes('tisort') || lowerFn.includes('kombin')) {
    return 'fashion';
  } else if (lowerFn.includes('spor') || lowerFn.includes('yoga') || lowerFn.includes('fitness') || lowerFn.includes('mat') || lowerFn.includes('kosu') || lowerFn.includes('dambil')) {
    return 'fitness';
  } else if (lowerFn.includes('ofis') || lowerFn.includes('toplanti') || lowerFn.includes('is') || lowerFn.includes('sirket') || lowerFn.includes('grafik') || lowerFn.includes('business')) {
    return 'business';
  } else if (lowerFn.includes('mimari') || lowerFn.includes('bina') || lowerFn.includes('ev') || lowerFn.includes('loft') || lowerFn.includes('tasarim') || lowerFn.includes('architecture')) {
    return 'architecture';
  } else if (lowerFn.includes('kedi') || lowerFn.includes('kopek') || lowerFn.includes('pet') || lowerFn.includes('hayvan') || lowerFn.includes('animal') || lowerFn.includes('kus')) {
    return 'animals';
  } else if (lowerFn.includes('seyahat') || lowerFn.includes('gezi') || lowerFn.includes('harita') || lowerFn.includes('canta') || lowerFn.includes('travel') || lowerFn.includes('turist')) {
    return 'travel';
  } else if (lowerFn.includes('araba') || lowerFn.includes('motor') || lowerFn.includes('motosiklet') || lowerFn.includes('oto') || lowerFn.includes('car') || lowerFn.includes('hiz')) {
    return 'automotive';
  } else if (lowerFn.includes('insan') || lowerFn.includes('kadin') || lowerFn.includes('adam') || lowerFn.includes('aile') || lowerFn.includes('cocuk') || lowerFn.includes('portre') || lowerFn.includes('portrait')) {
    return 'portrait';
  }
  return 'other';
}

export function generateAIData(categoryKey, filename = '', userPlan = 'starter', language = 'tr') {
  const TEMPLATES = language === 'en' ? CATEGORY_TEMPLATES_EN : CATEGORY_TEMPLATES;
  
  let selectedCategory = categoryKey || detectCategoryFromFilename(filename);
  
  if (!selectedCategory || !CATEGORY_TEMPLATES[selectedCategory]) {
    const keys = Object.keys(CATEGORY_TEMPLATES);
    selectedCategory = keys[Math.floor(Math.random() * keys.length)];
  }

  const template = TEMPLATES[selectedCategory] || CATEGORY_TEMPLATES[selectedCategory];
  
  const randomIndex = Math.floor(Math.random() * template.titles.length);
  const baseTitle = template.titles[randomIndex];
  const baseDesc = template.descriptions[randomIndex];
  const baseKeywords = template.keywords[0]; 
  
  const kwList = baseKeywords.split(', ').map(k => k.trim());

  let finalTitle = baseTitle;
  let finalDesc = baseDesc;
  let finalKeywords = kwList;

  if (userPlan === 'starter') {
    finalKeywords = kwList.slice(0, 20);
  } else if (userPlan === 'pro') {
    if (language === 'en') {
      finalDesc = `${baseDesc} This high-resolution and detailed image is optimized for your professional projects.`;
      finalKeywords = kwList.concat(['professional shot', 'seo compatible', 'aesthetic visual']).slice(0, 35);
    } else {
      finalDesc = `${baseDesc} Bu yüksek çözünürlüklü ve detaylı görsel, profesyonel projeleriniz için optimize edilmiştir.`;
      finalKeywords = kwList.concat(['profesyonel çekim', 'seo uyumlu', 'estetik görsel']).slice(0, 35);
    }
  } else if (userPlan === 'studio') {
    finalTitle = `[STUDIO VIP] ${baseTitle}`;
    if (language === 'en') {
      finalDesc = `${baseDesc} Crafted at the highest VIP studio standards, with professional studio lighting, superior focus clarity, rich textures, and deep composition quality for your commercial projects.`;
      finalKeywords = kwList.concat(['premium quality', 'studio shot', 'vip design', 'ultra high resolution', 'commercial use', 'professional lighting']).slice(0, 50);
    } else {
      finalDesc = `${baseDesc} En üst düzey VIP stüdyo standartlarında; profesyonel stüdyo ışıklandırması, üstün odak netliği, zengin dokular ve derin kompozisyon kalitesiyle ticari projeleriniz için özel olarak üretilmiştir.`;
      finalKeywords = kwList.concat(['premium kalite', 'stüdyo çekimi', 'vip tasarım', 'ultra yüksek çözünürlük', 'ticari kullanım', 'profesyonel ışıklandırma']).slice(0, 50);
    }
  }

  let ecoTitle = "";
  let ecoDesc = "";
  let ecoTags = "";

  if (selectedCategory === 'decor') {
    if (language === 'en') {
      if (randomIndex === 0) {
        ecoTitle = "Handmade Ceramic Coffee Mug | Custom Design Cup | Gift Mug - Minimalist Scandinavian Series";
        ecoDesc = `✨ Fully handmade ceramic mug that will add aesthetics to your home and coffee times.
      
• Material: High-quality stoneware clay and food-safe matte glaze.
• Volume: Approximately 320 ml.
• Gift Option: Shipped in a stylish kraft box with protective packaging.`;
        ecoTags = "ceramic mug, handmade mug, coffee cup, design mug, gift cup, kitchen decor";
      } else if (randomIndex === 1) {
        ecoTitle = "Bohemian Style Dried Flowers in Toprack Pot | Pampas Grass Arrangement | Home Decor";
        ecoDesc = `✨ Dried flower arrangement in a handmade terracotta pot that will bring a warm atmosphere to your home.
      
• Material: Natural clay pot and dried pampas grasses.
• Usage: Maintenance-free, long-lasting and aesthetic.
• Style: Ideal for bohemian and minimalist interior designs.`;
        ecoTags = "clay pot, dried flowers, pampas grass, bohemian decor, home decor, minimalist design";
      } else if (randomIndex === 2) {
        ecoTitle = "Natural Soy Candle Set | Luxury Marble Serving Tray | Aromatherapy Candle Gift Set";
        ecoDesc = `✨ 100% natural soy candles with calming aromatherapy effect and a luxury marble tray.
      
• Material: Organic soy wax, natural essential oils and real marble tray.
• Features: Lead-free cotton wick, clean burn.
• Usage: Great for spa, meditation and decorative purposes.`;
        ecoTags = "soy candle, marble tray, aromatherapy candle, gift set, natural candle, decorative candle";
      } else {
        ecoTitle = "Linen Textured Decorative Cushion Cover | Rustic Pillow Cover | Scandinavian Home Textile";
        ecoDesc = `✨ Natural linen textured cushion cover that will create comfortable and stylish corners in your home.
      
• Material: Premium linen blend fabric.
• Size: 45x45 cm (Hidden zipper).
• Care: Suitable for delicate machine wash at 30 degrees.`;
        ecoTags = "cushion cover, linen pillow, rustic decor, scandinavian style, home textile, pillow cover";
      }
    } else {
      if (randomIndex === 0) {
        ecoTitle = "El Yapımı Seramik Kahve Kupası | Özel Tasarım Kupa Bardak | Hediye Kupa Bardak - Minimalist İskandinav Serisi";
        ecoDesc = `✨ Kahve saatlerinize estetik katacak tamamen el yapımı seramik kupa.
      
• Malzeme: Yüksek kaliteli stoneware kil and gıdaya uygun mat sır.
• Hacim: Yaklaşık 320 ml.
• Hediye Seçeneği: Şık kraft kutusunda, korumalı ambalajıyla gönderilir.`;
        ecoTags = "seramik kupa, el yapimi kupa, kahve kupasi, tasarim kupa, hediye bardak, mutfak dekoru";
      } else if (randomIndex === 1) {
        ecoTitle = "Bohem Tarzı Toprak Saksıda Kuru Çiçek | Pampas Otu Aranjmanı | Ev Dekorasyonu";
        ecoDesc = `✨ Evinize sıcak bir atmosfer getirecek el yapımı toprak saksıda kurutulmuş çiçek aranjmanı.
      
• Malzeme: Toprak saksı ve kurutulmuş pampas otları.
• Kullanım: Bakım gerektirmez, uzun ömürlü ve estetiktir.
• Stil: Bohem ve minimalist iç mekan tasarımları için idealdir.`;
        ecoTags = "toprak saksi, kuru cicek, pampas otu, bohem dekorasyon, ev dekoru, minimalist tasarim";
      } else if (randomIndex === 2) {
        ecoTitle = "Doğal Soya Mumu Seti | Lüks Mermer Sunum Tepsisi | Aromaterapi Mum Hediye Seti";
        ecoDesc = `✨ Sakinleştirici aromaterapi etkili, %100 doğal soya mumları ve lüks mermer tepsi.
      
• Malzeme: Organik soya balmumu, doğal uçucu yağlar ve gerçek mermer tepsi.
• Özellikler: Kurşunsuz pamuk fitil, temiz yanma.
• Kullanım: Spa, meditasyon ve dekoratif amaçlı kullanım için harikadır.`;
        ecoTags = "soya mumu, mermer tepsi, aromaterapi mum, hediye set, dogal mum, dekoratif mum";
      } else {
        ecoTitle = "Keten Dokulu Dekoratif Kırlent Kılıfı | Rustik Minder Kılıfı | İskandinav Ev Tekstili";
        ecoDesc = `✨ Evinizde konforlu ve şık köşeler yaratacak doğal keten dokulu kırlent kılıfı.
      
• Malzeme: Premium keten karışımlı kumaş.
• Boyut: 45x45 cm (Gizli fermuarlı).
• Yıkama: 30 derecede hassas yıkamaya uygundur.`;
        ecoTags = "kirlent kilifi, keten minder, rustik dekorasyon, iskandinav tarzi, ev tekstili, yastik kilifi";
      }
    }
  } else if (selectedCategory === 'cosmetics') {
    if (language === 'en') {
      if (randomIndex === 0) {
        ecoTitle = "Organic Moisturizing Skin Serum | 100% Natural Hyaluronic Acid & Vegan Face Serum - Anti-Aging Glow";
        ecoDesc = `🌿 Naturally restore the intense moisture and radiance your skin needs.
      
• Ingredients: Hyaluronic Acid, Aloe Vera Extract, Organic Rose Water and Vitamin E.
• Effect: Penetrates deeper skin layers, plumps fine lines, creates an intense moisture barrier.
• Volume: 30ml amber glass bottle with dropper.`;
        ecoTags = "face serum, skincare, organic serum, natural cosmetics, moisturizer, hyaluronic acid";
      } else if (randomIndex === 1) {
        ecoTitle = "Nourishing Organic Night Cream | Face Moisturizer Cream | Wooden Spatula Included";
        ecoDesc = `🌿 100% organic night care cream that nourishes and regenerates your skin overnight.
      
• Ingredients: Organic plant extracts, Shea butter and natural vitamins.
• Usage: Apply to clean skin before bed with the help of the spatula.
• Features: Free from parabens and alcohol.`;
        ecoTags = "night cream, moisturizer cream, organic cream, face moisturizer, natural beauty";
      } else if (randomIndex === 2) {
        ecoTitle = "Green Clay Mask Set | Purifying Detox Clay Mask | Bamboo Application Brush Included";
        ecoDesc = `🌿 Pore-tightening natural green clay mask set that deeply cleanses your skin.
      
• Package Contents: Organic powdered clay, ceramic bowl and bamboo mask brush.
• Effect: Regulates oil balance, purifies blackheads.
• Application: Apply to clean skin 1-2 times a week and rinse.`;
        ecoTags = "clay mask, purifying mask, pore tightening, bamboo brush, detox skin care";
      } else {
        ecoTitle = "Aromatherapy Massage Oil | Rose Petal Moisturizing Body Oil | Glass Dropper Bottle";
        ecoDesc = `🌿 Aromatherapy oil enriched with fresh rose petals to relax your mind and body.
      
• Ingredients: Pure sweet almond oil, jojoba oil and natural rose oil.
• Usage: Can be used as a massage oil or post-bath body moisturizer.
• Volume: 50ml.`;
        ecoTags = "massage oil, aromatherapy oil, rose oil, body moisturizer, natural cosmetics, spa oil";
      }
    } else {
      if (randomIndex === 0) {
        ecoTitle = "Nemlendirici Cilt Bakım Serumu | %100 Doğal Hyalüronik Asit & Vegan Yüz Serumu - Anti-Aging Parıltı";
        ecoDesc = `🌿 Cildinizin ihtiyacı olan yoğun nemi ve ışıltıyı doğal yollarla geri kazanın.
      
• İçerik: Hyalüronik Asit, Aloe Vera, Gül Suyu ve Vitamin E.
• Etki: Yoğun nem bariyeri oluşturur, ince çizgileri dolgunlaştırır.
• Hacim: 30ml damlalıklı cam şişe.`;
        ecoTags = "yuz serumu, cilt bakimi, organik serum, nemlendirici, hyaluronik asit, vegan kozmetik";
      } else if (randomIndex === 1) {
        ecoTitle = "Besleyici Organik Gece Kremi | Yüz Nemlendirici Krem | Ahşap Spatula Hediyeli";
      ecoDesc = `🌿 Gece boyu cildinizi besleyen ve yenileyen %100 organik gece bakım kremi.
      
• Malzeme: Organik bitki özleri, Shea yağı ve doğal vitaminler.
• Kullanım: Temiz cilde gece yatmadan önce spatula yardımıyla uygulayın.
• Özellik: Paraben ve alkol içermez.`;
      ecoTags = "gece kremi, nemlendirici krem, organik krem, yuz nemlendirici, dogal guzellik";
    } else if (randomIndex === 2) {
      ecoTitle = "Yeşil Kil Maskesi Seti | Cilt Arındırıcı Detoks Kil Maskesi | Bambu Uygulama Fırçası Dahil";
      ecoDesc = `🌿 Cildinizi derinlemesine temizleyen, gözenek sıkılaştırıcı doğal yeşil kil maskesi seti.
      
• Paket İçeriği: Organik toz kil, seramik kase ve bambu maske fırçası.
• Etki: Yağ dengesini düzenler, siyah noktaları arındırır.
• Uygulama: Haftada 1-2 kez temiz cilde uygulayıp durulayın.`;
      ecoTags = "kil maskesi, arindirici maske, gozenek sikilastirici, bambu firca, detoks cilt bakimi";
    } else {
      ecoTitle = "Aromaterapi Masaj Yağı | Gül Yapraklı Nemlendirici Vücut Yağı | Damlalıklı Cam Şişe";
      ecoDesc = `🌿 Zihninizi ve bedeninizi dinlendirecek, taze gül yaprakları ile zenginleştirilmiş aromaterapi yağı.
      
• İçerik: Saf tatlı badem yağı, jojoba yağı ve doğal gül yağı.
• Kullanım: Masaj yağı veya banyo sonrası vücut nemlendiricisi olarak kullanılabilir.
• Hacim: 50ml.`;
      ecoTags = "masaj yagi, aromaterapi yag, gul yagi, vucut nemlendirici, dogal kozmetik, spa yagi";
    }
  }
  } else {
    // Other categories: dynamically map to index
    ecoTitle = `${finalTitle} | Premium Özel Tasarım Ürün`;
    ecoDesc = `✨ ${finalDesc}
    
• Ürün Türü: Premium tasarım ve yüksek malzeme kalitesi.
• Özellikler: Kullanışlı yapısı, estetik görünümü ile günlük hayatınıza renk katar.
• Kutu İçeriği: Ürünün kendisi, korumalı ambalajı ve kullanım kılavuzu ile birlikte gönderilir.`;
    ecoTags = finalKeywords.slice(0, 13).join(', ');
  }

  // Add plan specific touch to e-commerce descriptions
  if (userPlan === 'pro') {
    if (language === 'en') {
      ecoDesc += `\n\n🔥 [PRO Special Campaign] A 10% discount coupon valid on your first purchase this month will be sent with the package!`;
    } else {
      ecoDesc += `\n\n🔥 [PRO Özel Kampanya] Bu ay yapacağınız ilk alışverişte geçerli %10 indirim kuponu paketle birlikte gönderilecektir!`;
    }
  } else if (userPlan === 'studio') {
    ecoTitle = `[STUDIO VIP] ${ecoTitle}`;
    if (language === 'en') {
      ecoDesc = `👑 **STUDIO VIP PREMIUM PRODUCT** 👑\n\n${ecoDesc}\n\n✨ This product is listed with high-resolution professional studio shots under the VIP Studio plan. Unconditional return and 24/7 VIP customer support are guaranteed.`;
    } else {
      ecoDesc = `👑 **STUDIO VIP PREMIUM ÜRÜN** 👑\n\n${ecoDesc}\n\n✨ Bu ürün VIP Studio planı çerçevesinde yüksek çözünürlüklü profesyonel stüdyo çekimleriyle listelenmiştir. Koşulsuz iade ve 7/24 VIP müşteri desteği garantilidir.`;
    }
  }
  
  // Generate specific platforms metadata
  return {
    category: selectedCategory,
    // Raw Base
    title: finalTitle,
    description: finalDesc,
    keywords: finalKeywords.join(', '),
    tags: ecoTags,
    
    // Adobe Stock (Requires short clean titles and top keywords)
    adobe: {
      title: finalTitle,
      keywords: finalKeywords.slice(0, 30).join(', ')
    },
    
    // Shutterstock (Requires descriptive titles, detailed descriptions, up to 50 keywords)
    shutterstock: {
      title: language === 'en' ? `${finalTitle} - Stock Photo` : `${finalTitle} - Stok Fotoğrafı`,
      description: language === 'en' ? `${finalDesc} High-resolution image ideal for commercial use.` : `${finalDesc} Yüksek çözünürlüklü ticari kullanım için ideal görsel.`,
      keywords: language === 'en' 
        ? finalKeywords.concat(['stock image', 'shutterstock', 'high resolution', 'photography']).slice(0, 50).join(', ')
        : finalKeywords.concat(['stok görsel', 'shutterstock', 'yüksek çözünürlük', 'fotoğrafçılık']).slice(0, 50).join(', ')
    },
    
    // Freepik (Editorial title, lowercase tags)
    freepik: {
      title: finalTitle.toLowerCase(),
      keywords: finalKeywords.map(k => k.toLowerCase()).slice(0, 25).join(', ')
    },
    
    // Vecteezy (Clean title, tags)
    vecteezy: {
      title: finalTitle,
      description: finalDesc,
      keywords: finalKeywords.slice(0, 20).join(', ')
    },
    
    // E-Ticaret / Ürün Satış (Tailored title, sales description, Etsy/Trendyol 13 tags)
    ecommerce: {
      title: ecoTitle,
      description: ecoDesc,
      tags: ecoTags.split(', ').slice(0, 13).join(', ')
    }
  };
}

export async function generateGeminiMetadata(base64DataUrl, categoryKey, customApiKey = null, userPlan = 'starter', language = 'tr') {
  // Get JWT token from Supabase session
  const { supabase } = await import('./supabase.js');
  const { data: { session } } = await supabase.auth.getSession();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  // Call the secure backend proxy endpoint
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base64DataUrl,
      categoryKey,
      customApiKey, // Keep for backward compatibility if user provides their own key
      plan: userPlan,
      language
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = "API Hatası oluştu.";
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errMsg;
    } catch (e) {}
    throw new Error(errMsg);
  }

  const result = await response.json();
  return result;
}

