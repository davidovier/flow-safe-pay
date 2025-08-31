-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    published BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    reading_time INTEGER, -- estimated reading time in minutes
    seo_title TEXT,
    seo_description TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create blog_post_categories junction table
CREATE TABLE IF NOT EXISTS blog_post_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, category_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Create RLS policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

-- Public read access to published posts
CREATE POLICY "Public can read published blog posts" ON blog_posts
    FOR SELECT USING (published = true);

-- Public read access to categories
CREATE POLICY "Public can read blog categories" ON blog_categories
    FOR SELECT USING (true);

-- Public read access to post categories
CREATE POLICY "Public can read blog post categories" ON blog_post_categories
    FOR SELECT USING (true);

-- Admin/Author access (assuming admin role exists)
CREATE POLICY "Admins can manage blog posts" ON blog_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can manage blog categories" ON blog_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can manage blog post categories" ON blog_post_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'ADMIN'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for blog_posts
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
('Success Stories', 'success-stories', 'Real stories from creators and brands using FlowPay', '#10b981'),
('Platform Updates', 'platform-updates', 'Latest features and improvements', '#3b82f6'),
('Creator Tips', 'creator-tips', 'Tips and best practices for content creators', '#f59e0b'),
('Industry Insights', 'industry-insights', 'Trends and insights in the creator economy', '#8b5cf6'),
('Case Studies', 'case-studies', 'Detailed analysis of successful partnerships', '#ef4444')
ON CONFLICT (slug) DO NOTHING;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE blog_posts SET views = views + 1 WHERE id = post_id AND published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;