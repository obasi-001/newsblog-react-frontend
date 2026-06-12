import NewsPage from "../components/NewsPage";
import { pageConfigs } from "../config/pageConfig";

function Crime() {
  return <NewsPage pageConfig={pageConfigs.crime} />;
}

export default Crime;
