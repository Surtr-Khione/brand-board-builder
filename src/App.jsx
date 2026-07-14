import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useParams, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { FloatingFeedback } from './components/FeedbackButton';
import { captureReferral } from './lib/auth';
import { track } from './lib/track';

// Route-level code splitting: the homepage ships in the entry chunk for
// instant first paint; everything else (the 2,000-line Builder especially)
// loads on navigation.
const BrandBoardBuilder = lazy(() => import('./components/BrandBoardBuilder'));
const BrandLibrary = lazy(() => import('./pages/BrandLibrary'));
const BrandProfile = lazy(() => import('./pages/BrandProfile'));
const ContentStudio = lazy(() => import('./pages/ContentStudio'));
const FounderStart = lazy(() => import('./pages/FounderStart'));
const BrandGenerator = lazy(() => import('./pages/BrandGenerator'));
const BrandGuidelines = lazy(() => import('./pages/BrandGuidelines'));
const BrandCheck = lazy(() => import('./pages/BrandCheck'));
const Compare = lazy(() => import('./pages/Compare'));
const DriftWatch = lazy(() => import('./pages/DriftWatch'));
const Analyzer = lazy(() => import('./pages/Analyzer'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

function PageViews() {
  const location = useLocation();
  useEffect(() => { track('page_view'); }, [location.pathname]);
  return null;
}

function RouteLoader() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.12)', borderTopColor: '#0071E3',
        animation: 'bmd-spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes bmd-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function BoardPage() {
  const { boardId } = useParams();
  return <BrandBoardBuilder boardId={boardId} />;
}

function BrandProfilePage() {
  const { slug } = useParams();
  return <BrandProfile slug={slug} />;
}

export default function App() {
  useEffect(() => { captureReferral(); }, []);
  return (
    <BrowserRouter>
      <PageViews />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/start" element={<FounderStart />} />
          <Route path="/generate" element={<BrandGenerator />} />
          <Route path="/builder" element={<BrandBoardBuilder />} />
          <Route path="/board/:boardId" element={<BoardPage />} />
          <Route path="/board/:boardId/guidelines" element={<BrandGuidelines />} />
          <Route path="/board/:boardId/drift" element={<DriftWatch />} />
          <Route path="/check" element={<BrandCheck />} />
          <Route path="/check/:boardId" element={<BrandCheck />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/brands" element={<BrandLibrary />} />
          <Route path="/brands/:slug" element={<BrandProfilePage />} />
          <Route path="/analyzer" element={<Analyzer />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/studio" element={<ContentStudio />} />
          <Route path="/studio/:boardId" element={<ContentStudio />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </Suspense>
      <FloatingFeedback />
    </BrowserRouter>
  );
}
