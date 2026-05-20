import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';

// Curated premium high-resolution medical and AI technology images to ensure gorgeous results
const CURATED_MEDICAL_IMAGES = [
  {
    id: 'curated-1',
    url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
    description: 'Medical practitioner analyzing clinical data on digital tablet',
    author: 'National Cancer Institute',
    provider: 'unsplash'
  },
  {
    id: 'curated-2',
    url: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=400',
    description: 'Clinical laboratory with micro-robotic pipette and AI analyzer',
    author: 'National Cancer Institute',
    provider: 'unsplash'
  },
  {
    id: 'curated-3',
    url: 'https://images.unsplash.com/photo-1584515901367-f134706efc3e?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1584515901367-f134706efc3e?auto=format&fit=crop&q=80&w=400',
    description: 'Radiologist reviewing 3D brain magnetic resonance scanning',
    author: 'Piron Guillaume',
    provider: 'unsplash'
  },
  {
    id: 'curated-4',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400',
    description: 'High-tech AI neural network node connections and glowing cyber brain',
    author: 'Pietro Jeng',
    provider: 'unsplash'
  },
  {
    id: 'curated-5',
    url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=400',
    description: 'Healthcare professional wearing stethoscope with futuristic medical background',
    author: 'National Cancer Institute',
    provider: 'unsplash'
  },
  {
    id: 'curated-6',
    url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=400',
    description: 'Modern bioscience laboratory research instruments and test tubes',
    author: 'Hans Reniers',
    provider: 'unsplash'
  },
  {
    id: 'curated-7',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400',
    description: 'Physician examining digital medical card with patient metrics',
    author: 'National Cancer Institute',
    provider: 'unsplash'
  },
  {
    id: 'curated-8',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
    description: 'Abstract futuristic AI matrix computing and virtual learning concept',
    author: 'Milad Fakurian',
    provider: 'unsplash'
  },
  {
    id: 'curated-9',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
    description: 'Bio-engineer inspecting advanced robotic surgical hand mechanism',
    author: 'ThisIsEngineering',
    provider: 'unsplash'
  },
  {
    id: 'curated-10',
    url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1200',
    thumb: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=400',
    description: 'Advanced medical diagnostics panel displaying cognitive science parameters',
    author: 'National Cancer Institute',
    provider: 'unsplash'
  }
];

export async function GET(request: Request) {
  // Optional auth to ensure valid access, while maintaining public availability
  const sec = await checkSecurity(request, { requireAuth: false });
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'medical AI technology';
  
  try {
    // 1. Fetch from WordPress Openverse API (Creative Commons / Public Domain)
    const openverseUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=20`;
    
    let openverseImages: any[] = [];
    try {
      const openverseRes = await fetch(openverseUrl, {
        signal: AbortSignal.timeout(6000) // 6 seconds timeout to prevent freezing
      });
      
      if (openverseRes.ok) {
        const data = await openverseRes.json();
        openverseImages = (data.results || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          thumb: img.thumbnail || img.url,
          description: img.title || 'Creative Commons Medical Image',
          author: img.creator || 'Openverse',
          provider: img.provider || 'openverse'
        }));
      }
    } catch (e) {
      console.warn('[ImageSearchAPI] Openverse query timed out or failed:', e);
    }
    
    // 2. Filter curated premium images by keywords to ensure high query relevance
    const queryKeywords = query.toLowerCase().split(/\s+/);
    const filteredCurated = CURATED_MEDICAL_IMAGES.filter(img => {
      const desc = img.description.toLowerCase();
      // If query has specific words, try to match, otherwise return default set
      return queryKeywords.some(kw => kw.length > 2 && desc.includes(kw));
    });
    
    // 3. Fallback to full curated list if no keyword match is found
    const curatedListToUse = filteredCurated.length > 0 ? filteredCurated : CURATED_MEDICAL_IMAGES;
    
    // 4. Interleave results so curated premium images appear high up but Openverse results are fully available
    const combined = [];
    const maxLen = Math.max(curatedListToUse.length, openverseImages.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < curatedListToUse.length) combined.push(curatedListToUse[i]);
      if (i < openverseImages.length) combined.push(openverseImages[i]);
    }
    
    return NextResponse.json({ success: true, images: combined });
  } catch (error: any) {
    console.error('[ImageSearchAPI] Error searching stock databases:', error);
    // Safe fallback to curated list on absolute failure
    return NextResponse.json({ success: true, images: CURATED_MEDICAL_IMAGES });
  }
}
