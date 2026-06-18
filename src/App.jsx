import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import BrandBoardBuilder from './components/BrandBoardBuilder';
import BrandLibrary from './pages/BrandLibrary';
import BrandProfile from './pages/BrandProfile';

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
        <Route path="/" element={<BrandBoardBuilder />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
        <Route path="/brands" element={<BrandLibrary />} />
        <Route path="/brands/:slug" element={<BrandProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
