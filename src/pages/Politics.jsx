import NewsPage from "../components/NewsPage";
import { pageConfigs } from "../config/pageConfig";

function Politics() {
  return <NewsPage pageConfig={pageConfigs.politics} />;
}

export default Politics;
