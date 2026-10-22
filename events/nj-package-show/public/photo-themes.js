export const themes = {
 gallery:{label:'Royal Gallery',subtitle:'Cobalt · cream · gold',scene:'An imaginative New Jersey trade-show gallery with cobalt-blue architectural panels, cream stone and brushed-gold light grids. Premium editorial illustration.',colors:['#163e88','#d8bd74']},
 riviera:{label:'Italian Riviera',subtitle:'Sunlit coast · Italian elegance',scene:'An imaginative sunlit Italian coastal terrace overlooking a turquoise sea, lemon trees, cream arches and distant pastel architecture. Painterly travel-poster portrait, warm daylight.',colors:['#287c96','#edcf7c']},
 midnight:{label:'Emerald Evening',subtitle:'Velvet green · cinematic light',scene:'An imaginative Irish-inspired art-deco lounge with emerald velvet, dark carved arches and gentle amber lighting. Cinematic editorial portrait with deep green tones. No drinks, bottles, or extra people.',colors:['#126653','#e3c795']},
 celebration:{label:'Golden Celebration',subtitle:'Spotlights · a royal entrance',scene:'An imaginative golden premiere entrance with champagne-colored architectural ribbons, soft spotlights and restrained abstract confetti. Luminous fashion-editorial portrait. No alcohol, crowds, paparazzi or extra people.',colors:['#976c36','#f3dfaa']}
};
export const themeLabels=Object.fromEntries(Object.entries(themes).map(([id,t])=>[id,t.label]));
