import { useParams } from "react-router-dom";
import NewsPage from "../components/NewsPage";
import { getSportsPageConfig } from "../config/pageConfig";

function Sports() {
  const { sportSlug } = useParams();
  const pageConfig = getSportsPageConfig(sportSlug);

  return <NewsPage pageConfig={pageConfig} />;
}

export default Sports;
