import NewsPage from "../components/NewsPage";
import { pageConfigs } from "../config/pageConfig";

function Environment() {
  return <NewsPage pageConfig={pageConfigs.environment} />;
}

export default Environment;
