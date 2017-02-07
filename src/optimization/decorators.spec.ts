import * as decorators from './decorators';

describe('optimization', () => {
  describe('purgeDecoratorStatements', () => {
    it('should purge the decorators', () => {
      // arrange
      const decoratorStatement = `
      IonicModule.decorators = [
    { type: NgModule, args: [{
                imports: [BrowserModule, HttpModule, FormsModule, ReactiveFormsModule],
                exports: [
                    BrowserModule,
                    HttpModule,
                    FormsModule,
                    ReactiveFormsModule,
                    Avatar,
                    Backdrop,
                    Badge,
                    Button,
                    Card,
                    CardContent,
                    CardHeader,
                    CardTitle,
                    Checkbox,
                    Chip,
                    ClickBlock,
                    Col,
                    Content,
                    // DateTime,
                    FabContainer,
                    FabButton,
                    FabList,
                    Footer,
                    Grid,
                    Header,
                    HideWhen,
                    Icon,
                    Img,
                    InfiniteScroll,
                    InfiniteScrollContent,
                    IonicApp,
                    Item,
                    ItemContent,
                    ItemDivider,
                    ItemGroup,
                    ItemOptions,
                    ItemReorder,
                    ItemSliding,
                    Label,
                    List,
                    ListHeader,
                    Menu,
                    MenuClose,
                    MenuToggle,
                    NativeInput,
                    Nav,
                    Navbar,
                    NavPop,
                    NavPopAnchor,
                    NavPush,
                    NavPushAnchor,
                    NextInput,
                    Note,
                    Option,
                    OverlayPortal,
                    PickerColumnCmp,
                    RadioButton,
                    RadioGroup,
                    Range,
                    RangeKnob,
                    Refresher,
                    RefresherContent,
                    Reorder,
                    Row,
                    Scroll,
                    Searchbar,
                    Segment,
                    SegmentButton,
                    // Select,
                    ShowWhen,
                    Slide,
                    Slides,
                    Spinner,
                    Tab,
                    Tabs,
                    TabButton,
                    TabHighlight,
                    TextInput,
                    Thumbnail,
                    Toggle,
                    Toolbar,
                    ToolbarItem,
                    ToolbarTitle,
                    Typography,
                    VirtualFooter,
                    VirtualHeader,
                    VirtualItem,
                    VirtualScroll,
                ],
                declarations: [
                    ActionSheetCmp,
                    AlertCmp,
                    ClickBlock,
                    LoadingCmp,
                    ModalCmp,
                    PickerCmp,
                    PopoverCmp,
                    ToastCmp,
                    Avatar,
                    Backdrop,
                    Badge,
                    Button,
                    Card,
                    CardContent,
                    CardHeader,
                    CardTitle,
                    Checkbox,
                    Chip,
                    ClickBlock,
                    Col,
                    Content,
                    // DateTime,
                    FabContainer,
                    FabButton,
                    FabList,
                    Footer,
                    Grid,
                    Header,
                    HideWhen,
                    Icon,
                    Img,
                    InfiniteScroll,
                    InfiniteScrollContent,
                    IonicApp,
                    Item,
                    ItemContent,
                    ItemDivider,
                    ItemGroup,
                    ItemOptions,
                    ItemReorder,
                    ItemSliding,
                    Label,
                    List,
                    ListHeader,
                    Menu,
                    MenuClose,
                    MenuToggle,
                    NativeInput,
                    Nav,
                    Navbar,
                    NavPop,
                    NavPopAnchor,
                    NavPush,
                    NavPushAnchor,
                    NextInput,
                    Note,
                    Option,
                    OverlayPortal,
                    PickerColumnCmp,
                    RadioButton,
                    RadioGroup,
                    Range,
                    RangeKnob,
                    Refresher,
                    RefresherContent,
                    Reorder,
                    Row,
                    Scroll,
                    Searchbar,
                    Segment,
                    SegmentButton,
                    // Select,
                    ShowWhen,
                    Slide,
                    Slides,
                    Spinner,
                    Tab,
                    Tabs,
                    TabButton,
                    TabHighlight,
                    TextInput,
                    Thumbnail,
                    Toggle,
                    Toolbar,
                    ToolbarItem,
                    ToolbarTitle,
                    Typography,
                    VirtualFooter,
                    VirtualHeader,
                    VirtualItem,
                    VirtualScroll,
                ],
                entryComponents: []
            },] },
];
      `;

      const additionalGeneratedContent = `
      /** @nocollapse */
IonicModule.ctorParameters = () => [];
function IonicModule_tsickle_Closure_declarations() {
    /** @type {?} */
    IonicModule.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    IonicModule.ctorParameters;
}
** @nocollapse */
LazyModule.ctorParameters = () => [];
function LazyModule_tsickle_Closure_declarations() {
    /** @type {?} */
    LazyModule.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    LazyModule.ctorParameters;
}
      `;


      const knownContent = `
      some various content
${decoratorStatement}
${additionalGeneratedContent}

some more content
      `;
      // act
      const result = decorators.purgeDecoratorStatementsImpl('/Users/dan/Dev/myApp3/node_modules/ionic-angular/index.js', knownContent, ['ionic-angular/index.js']);

      console.log(result);
      // assert
      expect(result).not.toEqual(knownContent);
      expect(result.indexOf(decoratorStatement)).toEqual(-1);
      expect(result.indexOf(additionalGeneratedContent)).toBeGreaterThan(-1);
    });
  });
});
