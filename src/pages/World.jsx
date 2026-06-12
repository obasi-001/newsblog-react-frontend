import NewsPage from "../components/NewsPage";
import { pageConfigs } from "../config/pageConfig";

function World() {
  return <NewsPage pageConfig={pageConfigs.world} />;
}

export default World;
