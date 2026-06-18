-- ============================================================
--  PUBLIC BRANDS LIBRARY
--  Target: xpbnglcrnnyfdzkswmsm (Brand Board Builder)
-- ============================================================

-- Main brands table
create table if not exists public_brands (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  brand_name      text not null,
  industry        text,
  archetype       text,
  website         text,
  tagline         text,
  description     text,
  mission         text,
  vision          text,
  elevator        text,
  primary_color   text default '#000000',
  secondary_color text default '#ffffff',
  accent_color    text default '#666666',
  primary_font    text,
  body_font       text,
  tone_attributes text[],
  brand_personality text[],
  photo_style     text,
  social_personality text,
  founded_year    int,
  country         text default 'United States',
  brand_data      jsonb,
  is_featured     boolean default false,
  is_verified     boolean default false,
  submitted_by_email text,
  view_count      int default 0,
  fts             tsvector generated always as (
    to_tsvector('english',
      coalesce(brand_name, '') || ' ' ||
      coalesce(industry, '') || ' ' ||
      coalesce(archetype, '') || ' ' ||
      coalesce(tagline, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(elevator, '')
    )
  ) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz default now()
);

create index if not exists idx_pb_fts        on public_brands using gin(fts);
create index if not exists idx_pb_archetype  on public_brands(archetype);
create index if not exists idx_pb_industry   on public_brands(industry);
create index if not exists idx_pb_featured   on public_brands(is_featured) where is_featured = true;
create index if not exists idx_pb_views      on public_brands(view_count desc);
create index if not exists idx_pb_published  on public_brands(published_at desc);

-- Year-over-year evolution snapshots
create table if not exists brand_snapshots (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references public_brands(id) on delete cascade,
  year          int not null,
  snapshot_data jsonb not null,
  change_notes  text,
  created_at    timestamptz not null default now(),
  unique(brand_id, year)
);

create index if not exists idx_bs_brand on brand_snapshots(brand_id, year desc);

-- Updated-at trigger
create or replace function touch_public_brands_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_pb_updated_at on public_brands;
create trigger trg_pb_updated_at
  before update on public_brands
  for each row execute function touch_public_brands_updated_at();

-- RLS
alter table public_brands    enable row level security;
alter table brand_snapshots  enable row level security;

drop policy if exists "public_brands_read"     on public_brands;
drop policy if exists "brand_snapshots_read"   on brand_snapshots;
drop policy if exists "public_brands_service"  on public_brands;
drop policy if exists "brand_snapshots_service" on brand_snapshots;

create policy "public_brands_read"    on public_brands   for select using (true);
create policy "brand_snapshots_read"  on brand_snapshots for select using (true);
create policy "public_brands_service" on public_brands   for all to service_role using (true) with check (true);
create policy "brand_snapshots_service" on brand_snapshots for all to service_role using (true) with check (true);

-- ============================================================
--  SEED — 15 iconic brands
-- ============================================================
insert into public_brands (
  slug, brand_name, industry, archetype, website, tagline, description, mission,
  primary_color, secondary_color, accent_color, primary_font, body_font,
  tone_attributes, brand_personality, photo_style, social_personality,
  founded_year, country, is_featured, is_verified
) values

('apple', 'Apple', 'Consumer Technology', 'The Creator',
  'apple.com', 'Think Different.',
  'Apple designs products that sit at the intersection of technology and liberal arts — tools so intuitive they feel like extensions of the human mind.',
  'To create the most advanced technology in the most human way possible.',
  '#0071e3', '#1d1d1f', '#2997ff', 'SF Pro Display', 'SF Pro Text',
  ARRAY['Bold','Minimal','Aspirational'], ARRAY['Innovative','Refined','Empowering'],
  'Clean product photography on pure white or black. No clutter. The product IS the subject.',
  'Confident and exclusive — never shouts, always curates. Posts sparingly but memorably.',
  1976, 'United States', true, true),

('nike', 'Nike', 'Athletic Apparel', 'The Hero',
  'nike.com', 'Just Do It.',
  'Nike fuels athletic ambition for every body on earth — from weekend joggers to world champions. The brand believes if you have a body, you are an athlete.',
  'To bring inspiration and innovation to every athlete in the world.',
  '#FF6B00', '#111111', '#FFFFFF', 'Futura', 'Trade Gothic',
  ARRAY['Motivational','Bold','Inclusive'], ARRAY['Courageous','Driven','Authentic'],
  'Gritty, high-energy athlete photography. Sweat, motion blur, raw emotion. Never staged.',
  'Champions causes. Celebrates athletes. Unafraid to take a stand. Always in motion.',
  1964, 'United States', true, true),

('tesla', 'Tesla', 'Electric Vehicles', 'The Magician',
  'tesla.com', 'Accelerating the World''s Transition to Sustainable Energy.',
  'Tesla engineers the future — electric vehicles, solar energy, and battery storage that are better than fossil fuel alternatives in every way.',
  'To accelerate the world''s transition to sustainable energy.',
  '#E31937', '#171A20', '#FFFFFF', 'Gotham', 'Inter',
  ARRAY['Technical','Direct','Visionary'], ARRAY['Revolutionary','Precise','Disruptive'],
  'Product-led photography. Cars in dramatic landscapes. No drivers — just machine perfection.',
  'Elon-forward, meme-literate, technical deep-dives mixed with customer delivery moments.',
  2003, 'United States', true, true),

('patagonia', 'Patagonia', 'Outdoor Apparel', 'The Explorer',
  'patagonia.com', 'We''re in business to save our home planet.',
  'Patagonia makes outdoor clothing and gear for climbers, skiers, surfers, and trail runners — but its true product is a model for doing business with radical integrity.',
  'We''re in business to save our home planet.',
  '#006241', '#1B1B1B', '#F5A623', 'Freight Display', 'Freight Text',
  ARRAY['Authentic','Activist','Uncompromising'], ARRAY['Wild','Responsible','Direct'],
  'Environmental documentary photography. Real athletes in raw nature. Weathered, honest.',
  'Openly political about climate. Anti-consumerist even while selling products. Deeply earned trust.',
  1973, 'United States', true, true),

('spotify', 'Spotify', 'Music & Audio Streaming', 'The Jester',
  'spotify.com', 'Music for everyone.',
  'Spotify is the audio platform that gives a million artists the opportunity to live off their art and billions of fans the opportunity to enjoy it.',
  'To unlock the potential of human creativity — by giving a million creative artists the opportunity to live off their art.',
  '#1DB954', '#191414', '#FFFFFF', 'Circular', 'Circular',
  ARRAY['Playful','Data-driven','Cultural'], ARRAY['Fun','Inclusive','Clever'],
  'Bright greens on black. Playful, colorful editorial. Artist portraits with pop-art energy.',
  'Self-aware and witty. Loves data ("Wrapped"). Celebrates music culture with genuine enthusiasm.',
  2006, 'Sweden', true, true),

('airbnb', 'Airbnb', 'Travel & Hospitality', 'The Caregiver',
  'airbnb.com', 'Belong Anywhere.',
  'Airbnb connects people who want to share their homes with people who are looking for unique travel experiences anywhere in the world.',
  'To help create a world where anyone can belong anywhere.',
  '#FF5A5F', '#00A699', '#FC642D', 'Cereal', 'Cereal',
  ARRAY['Warm','Welcoming','Human'], ARRAY['Belonging','Curious','Generous'],
  'Lifestyle photography of real hosts, real homes, authentic moments. Golden hour light.',
  'Storytelling-first. Features host stories, local experiences, and community moments.',
  2008, 'United States', false, true),

('netflix', 'Netflix', 'Entertainment Streaming', 'The Rebel',
  'netflix.com', 'See What''s Next.',
  'Netflix is the world''s leading streaming service — delivering premium TV shows, films, and documentaries to 238 million households in 190 countries.',
  'To entertain the world.',
  '#E50914', '#141414', '#FFFFFF', 'Netflix Sans', 'Netflix Sans',
  ARRAY['Bold','Cinematic','Direct'], ARRAY['Disruptive','Bold','Cultural'],
  'Cinematic stills from original content. High contrast, dramatic lighting. A-list talent.',
  'Meme-fluent, self-deprecating humor. Treats fans as insiders. "Netflix is a joke" energy.',
  1997, 'United States', false, true),

('google', 'Google', 'Search & Technology', 'The Sage',
  'google.com', 'Organize the World''s Information.',
  'Google''s mission is to organize the world''s information and make it universally accessible and useful — the ultimate democratizer of knowledge.',
  'To organize the world''s information and make it universally accessible and useful.',
  '#4285F4', '#34A853', '#EA4335', 'Google Sans', 'Roboto',
  ARRAY['Accessible','Curious','Helpful'], ARRAY['Smart','Friendly','Universal'],
  'Bright, clean illustrations and photography. Diverse, real people. Primary color system.',
  'Informative and celebratory. Doodles, anniversaries, causes. Always curious, never pretentious.',
  1998, 'United States', false, true),

('coca-cola', 'Coca-Cola', 'Beverages', 'The Innocent',
  'coca-cola.com', 'Open Happiness.',
  'Coca-Cola is the world''s most recognized brand — a symbol of shared joy, optimism, and connection that has refreshed billions of people for over 135 years.',
  'To refresh the world, inspire moments of optimism and happiness, create value and make a difference.',
  '#F40009', '#000000', '#FFFFFF', 'Lato', 'Roboto',
  ARRAY['Joyful','Nostalgic','Universal'], ARRAY['Optimistic','Classic','Warm'],
  'Happy moments, friends sharing, celebrations. Saturated reds, ice, effervescence.',
  'Celebratory and nostalgic. Focuses on togetherness, holidays, and feel-good moments.',
  1886, 'United States', false, true),

('amazon', 'Amazon', 'E-commerce & Cloud', 'The Ruler',
  'amazon.com', 'Work Hard. Have Fun. Make History.',
  'Amazon is guided by four principles: customer obsession, passion for invention, commitment to operational excellence, and long-term thinking.',
  'To be Earth''s most customer-centric company.',
  '#FF9900', '#232F3E', '#FFFFFF', 'Ember', 'Amazon Ember',
  ARRAY['Customer-obsessed','Efficient','Vast'], ARRAY['Reliable','Ambitious','Innovative'],
  'Product-first, lifestyle photography. Real customers. Efficiency and convenience visualized.',
  'Customer-centric storytelling. Prime Day hype. Alexa humor. AWS thought leadership.',
  1994, 'United States', false, true),

('louis-vuitton', 'Louis Vuitton', 'Luxury Fashion', 'The Ruler',
  'louisvuitton.com', 'The Art of Travel.',
  'Louis Vuitton is the world''s most valuable luxury brand — a house where meticulous craftsmanship, heritage, and contemporary art converge.',
  'To be a symbol of excellence, elegance, and creation — the ultimate expression of the luxury dream.',
  '#B5A06D', '#1A1008', '#FFFFFF', 'Louis Vuitton TW', 'Helvetica Neue',
  ARRAY['Exclusive','Heritage','Artistic'], ARRAY['Prestigious','Timeless','Cultural'],
  'Artistic fashion photography, editorial campaigns, museum-quality staging. Never casual.',
  'Quiet luxury. Minimal posts, maximum impact. Art collaborations. Celebrity editorial.',
  1854, 'France', true, true),

('canva', 'Canva', 'Design Software', 'The Creator',
  'canva.com', 'Design Anything. Publish Anywhere.',
  'Canva is the world''s most used design platform — making professional design accessible to everyone from students to global enterprises.',
  'To empower the world to design.',
  '#8B3DFF', '#00C4CC', '#FF7262', 'Canva Sans', 'Canva Sans',
  ARRAY['Empowering','Colorful','Accessible'], ARRAY['Creative','Friendly','Inclusive'],
  'Bright, colorful, diverse. Shows real users creating. Rainbow palettes and joyful energy.',
  'Tips-heavy, community-driven. Celebrates user creations. Approachable and encouraging.',
  2013, 'Australia', false, true),

('openai', 'OpenAI', 'Artificial Intelligence', 'The Sage',
  'openai.com', 'Creating Safe AGI That Benefits All of Humanity.',
  'OpenAI is the research company behind ChatGPT and GPT-4 — pushing the frontier of artificial intelligence with a focus on safety and broad benefit.',
  'To ensure that artificial general intelligence benefits all of humanity.',
  '#10A37F', '#0D0D0D', '#FFFFFF', 'Söhne', 'Söhne',
  ARRAY['Technical','Measured','Responsible'], ARRAY['Intelligent','Thoughtful','Pioneering'],
  'Abstract AI visualizations, clean UI screenshots, minimal human elements.',
  'Research-forward, safety-conscious. Technical depth. Understated about capabilities.',
  2015, 'United States', false, true),

('red-bull', 'Red Bull', 'Energy Drinks', 'The Hero',
  'redbull.com', 'Red Bull Gives You Wings.',
  'Red Bull is the world''s leading energy drink brand — powering extreme sports, music, and adventure with a culture-first media strategy unlike any company on earth.',
  'To give wings to people and ideas.',
  '#CC1E4A', '#1B2B4B', '#FFFF00', 'Helvetica', 'Helvetica',
  ARRAY['Extreme','Energetic','Cultural'], ARRAY['Daring','Athletic','Irreverent'],
  'Action sports photography. Peak performance moments. Athletes defying gravity.',
  'Content media company disguised as a drink brand. Owns the conversation around extreme sports.',
  1987, 'Austria', false, true),

('notion', 'Notion', 'Productivity Software', 'The Creator',
  'notion.com', 'Write, Plan, Collaborate.',
  'Notion is the connected workspace where millions of teams and individuals organize everything — notes, docs, databases, and wikis — in one tool.',
  'To make toolmaking accessible to everyone.',
  '#000000', '#FFFFFF', '#F1C40F', 'Neue Haas Grotesk', 'Neue Haas Grotesk',
  ARRAY['Calm','Empowering','Versatile'], ARRAY['Creative','Thoughtful','Minimalist'],
  'Clean, minimal workspace screenshots. Soft neutrals. Real user setups. Serif editorial moments.',
  'Template-first content. Community celebration. Calm and intellectual. Never aggressive.',
  2016, 'United States', false, true)

on conflict (slug) do nothing;

-- Initial snapshots for 2025
insert into brand_snapshots (brand_id, year, snapshot_data, change_notes)
select id, 2025,
  jsonb_build_object(
    'brandName', brand_name, 'tagline', tagline, 'industry', industry,
    'archetype', archetype, 'mission', mission, 'primaryColor', primary_color,
    'secondaryColor', secondary_color, 'accentColor', accent_color,
    'primaryFont', primary_font, 'toneAttributes', tone_attributes,
    'brandPersonality', brand_personality
  ),
  'Initial library entry'
from public_brands
where is_verified = true
on conflict (brand_id, year) do nothing;
