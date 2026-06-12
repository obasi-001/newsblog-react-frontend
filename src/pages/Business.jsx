import NewsPage from "../components/NewsPage";
import { pageConfigs } from "../config/pageConfig";

function Business() {
  return <NewsPage pageConfig={pageConfigs.business} />;
}

export default Business;
