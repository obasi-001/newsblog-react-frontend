import NewsPage from "../components/NewsPage";
import { pageConfigs } from "../config/pageConfig";

function Home() {
  return <NewsPage pageConfig={pageConfigs.home} />;
}

export default Home;
