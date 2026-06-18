import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import BrandBoardBuilder from './components/BrandBoardBuilder';

function BoardPage() {
  const { boardId } = useParams();
  return <BrandBoardBuilder boardId={boardId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BrandBoardBuilder />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
