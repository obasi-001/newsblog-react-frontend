import NewsPage from "../components/NewsPage";
import { pageConfigs } from "../config/pageConfig";

function Entertainment() {
  return <NewsPage pageConfig={pageConfigs.entertainment} />;
}

export default Entertainment;
