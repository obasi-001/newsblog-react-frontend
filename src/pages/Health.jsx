import NewsPage from "../components/NewsPage";
import { pageConfigs } from "../config/pageConfig";

function Health() {
  return <NewsPage pageConfig={pageConfigs.health} />;
}

export default Health;
