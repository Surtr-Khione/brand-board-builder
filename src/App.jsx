import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import BrandBoardBuilder from './components/BrandBoardBuilder';
import BrandLibrary from './pages/BrandLibrary';
import BrandProfile from './pages/BrandProfile';
import HomePage from './pages/HomePage';
import ContentStudio from './pages/ContentStudio';
import FounderStart from './pages/FounderStart';
import BrandGuidelines from './pages/BrandGuidelines';
import BrandCheck from './pages/BrandCheck';
import Compare from './pages/Compare';
import DriftWatch from './pages/DriftWatch';
import Analyzer from './pages/Analyzer';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import { FloatingFeedback } from './components/FeedbackButton';
import { captureReferral } from './lib/auth';

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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/start" element={<FounderStart />} />
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
      </Routes>
      <FloatingFeedback />
    </BrowserRouter>
  );
}
