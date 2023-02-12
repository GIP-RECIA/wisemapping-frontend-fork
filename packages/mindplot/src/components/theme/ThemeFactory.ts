import NodeModel from '../model/NodeModel';
import ClassicTheme from './ClassicTheme';
import PrismTheme from './PrismTheme';
import Theme from './Theme';

type ThemeId = 'prism' | 'classic';

class ThemeFactory {
  private static prismTheme = new PrismTheme();

  private static classicTheme = new ClassicTheme();

  static createById(id: ThemeId): Theme {
    let result: Theme;
    switch (id) {
      case 'classic':
        result = ThemeFactory.classicTheme;
        break;
      case 'prism':
        result = ThemeFactory.prismTheme;
        break;
      default: {
        const exhaustiveCheck: never = id;
        throw new Error(exhaustiveCheck);
      }
    }
    return result;
  }

  static create(model: NodeModel): Theme {
    const mindmap = model.getMindmap();
    const theme = mindmap.getTheme();
    return ThemeFactory.createById(theme);
  }
}
export default ThemeFactory;
