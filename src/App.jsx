import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import BrandBoardBuilder from './components/BrandBoardBuilder';
import BrandLibrary from './pages/BrandLibrary';
import BrandProfile from './pages/BrandProfile';
import HomePage from './pages/HomePage';
import ContentStudio from './pages/ContentStudio';
import { FloatingFeedback } from './components/FeedbackButton';

function BoardPage() {
  const { boardId } = useParams();
  return <BrandBoardBuilder boardId={boardId} />;
}

function BrandProfilePage() {
  const { slug } = useParams();
  return <BrandProfile slug={slug} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/builder" element={<BrandBoardBuilder />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
        <Route path="/brands" element={<BrandLibrary />} />
        <Route path="/brands/:slug" element={<BrandProfilePage />} />
        <Route path="/studio" element={<ContentStudio />} />
        <Route path="/studio/:boardId" element={<ContentStudio />} />
      </Routes>
      <FloatingFeedback />
    </BrowserRouter>
  );
}
