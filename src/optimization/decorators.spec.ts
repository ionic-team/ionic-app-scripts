import { join } from 'path';
import * as decorators from './decorators';

import * as MagicString from 'magic-string';

const baseDir = join(process.cwd(), 'myApp');
const ionicAngular = join(baseDir, 'node_modules', 'ionic-angular');
const angularDir = join(baseDir, 'node_modules', '@angular');
const srcDir = join(baseDir, 'src');


describe('optimization', () => {
  describe('purgeStaticFieldDecorators', () => {

    it('should remove the static decorator', () => {
      // arrange
      const decoratorStatement = `
      import { Taco } from 'blah';
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
      let magicString = new MagicString(knownContent);
      const entryPoint = join(ionicAngular, 'index.js');
      magicString = decorators.purgeStaticFieldDecorators(entryPoint, knownContent, ionicAngular, angularDir, srcDir, magicString);
      const result = magicString.toString();

      // assert
      expect(result).not.toEqual(knownContent);
      expect(result.indexOf(decoratorStatement)).toEqual(-1);
    });

    it('should not remove decorators when it has an injectable statement in it', () => {
        const knownContent = `
var ActionSheetController = (function () {
    /**
     * @param {?} _app
     * @param {?} config
     */
    function ActionSheetController(_app, config) {
        this._app = _app;
        this.config = config;
    }
    /**
     * Open an action sheet with a title, subTitle, and an array of buttons
     * @param {?=} opts
     * @return {?}
     */
    ActionSheetController.prototype.create = function (opts) {
        if (opts === void 0) { opts = {}; }
        return new ActionSheet(this._app, opts, this.config);
    };
    return ActionSheetController;
}());
export { ActionSheetController };
ActionSheetController.decorators = [
    { type: Injectable },
];
/**
 * @nocollapse
 */
ActionSheetController.ctorParameters = function () { return [
    { type: App, },
    { type: Config, },
]; };
        `;

      let magicString = new MagicString(knownContent);
      const entryPoint = join(ionicAngular, 'index.js');
      magicString = decorators.purgeStaticFieldDecorators(entryPoint, knownContent, ionicAngular, angularDir, srcDir, magicString);
      const result = magicString.toString();
      expect(result).toEqual(knownContent);
    });

    it('should work with the ionic-angular index file', () => {
        const ionicModuleDecorator = `
IonicModule.decorators = [
    { type: NgModule, args: [{
                imports: [
                    CommonModule,
                    FormsModule,
                    ReactiveFormsModule,
                    ActionSheetModule.forRoot(),
                    AlertModule.forRoot(),
                    AppModule.forRoot(),
                    AvatarModule.forRoot(),
                    BackdropModule.forRoot(),
                    BadgeModule.forRoot(),
                    ButtonModule.forRoot(),
                    CardModule.forRoot(),
                    CheckboxModule.forRoot(),
                    ChipModule.forRoot(),
                    ClickBlockModule.forRoot(),
                    ContentModule.forRoot(),
                    DateTimeModule.forRoot(),
                    FabModule.forRoot(),
                    GridModule.forRoot(),
                    IconModule.forRoot(),
                    ImgModule.forRoot(),
                    InfiniteScrollModule.forRoot(),
                    InputModule.forRoot(),
                    ItemModule.forRoot(),
                    LabelModule.forRoot(),
                    ListModule.forRoot(),
                    LoadingModule.forRoot(),
                    MenuModule.forRoot(),
                    ModalModule.forRoot(),
                    NavModule.forRoot(),
                    NavbarModule.forRoot(),
                    NoteModule.forRoot(),
                    OptionModule.forRoot(),
                    PickerModule.forRoot(),
                    PopoverModule.forRoot(),
                    RadioModule.forRoot(),
                    RangeModule.forRoot(),
                    RefresherModule.forRoot(),
                    ScrollModule.forRoot(),
                    SearchbarModule.forRoot(),
                    SegmentModule.forRoot(),
                    SelectModule.forRoot(),
                    ShowHideWhenModule.forRoot(),
                    SlidesModule.forRoot(),
                    SpinnerModule.forRoot(),
                    SplitPaneModule.forRoot(),
                    TabsModule.forRoot(),
                    ThumbnailModule.forRoot(),
                    ToastModule.forRoot(),
                    ToggleModule.forRoot(),
                    ToolbarModule.forRoot(),
                    TypographyModule.forRoot(),
                    VirtualScrollModule.forRoot()
                ],
                exports: [
                    CommonModule,
                    FormsModule,
                    ReactiveFormsModule,
                    ActionSheetModule,
                    AlertModule,
                    AppModule,
                    AvatarModule,
                    BackdropModule,
                    BadgeModule,
                    ButtonModule,
                    CardModule,
                    CheckboxModule,
                    ChipModule,
                    ClickBlockModule,
                    ContentModule,
                    DateTimeModule,
                    FabModule,
                    GridModule,
                    IconModule,
                    ImgModule,
                    InfiniteScrollModule,
                    InputModule,
                    ItemModule,
                    LabelModule,
                    ListModule,
                    LoadingModule,
                    MenuModule,
                    ModalModule,
                    NavModule,
                    NavbarModule,
                    NoteModule,
                    OptionModule,
                    PickerModule,
                    PopoverModule,
                    RadioModule,
                    RangeModule,
                    RefresherModule,
                    ScrollModule,
                    SearchbarModule,
                    SegmentModule,
                    SelectModule,
                    ShowHideWhenModule,
                    SlidesModule,
                    SpinnerModule,
                    SplitPaneModule,
                    TabsModule,
                    ThumbnailModule,
                    ToastModule,
                    ToggleModule,
                    ToolbarModule,
                    TypographyModule,
                    VirtualScrollModule
                ]
            },] },
];
        `;
        const knownContent = `
import { ANALYZE_FOR_ENTRY_COMPONENTS, APP_INITIALIZER, ComponentFactoryResolver, Inject, Injector, NgModule, NgZone, Optional } from '@angular/core';
import { APP_BASE_HREF, Location, LocationStrategy, HashLocationStrategy, PathLocationStrategy, PlatformLocation } from '@angular/common';
import { DOCUMENT } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ActionSheetController } from './components/action-sheet/action-sheet-controller';
import { AlertController } from './components/alert/alert-controller';
import { App } from './components/app/app';
import { AppRootToken } from './components/app/app-root';
import { Config, setupConfig, ConfigToken } from './config/config';
import { DeepLinker, setupDeepLinker } from './navigation/deep-linker';
import { DomController } from './platform/dom-controller';
import { Events, setupProvideEvents } from './util/events';
import { Form } from './util/form';
import { GestureController } from './gestures/gesture-controller';
import { Haptic } from './tap-click/haptic';
import { Keyboard } from './platform/keyboard';
import { LoadingController } from './components/loading/loading-controller';
import { MenuController } from './components/menu/menu-controller';
import { ModalController } from './components/modal/modal-controller';
import { ModuleLoader, provideModuleLoader, setupPreloading, LAZY_LOADED_TOKEN } from './util/module-loader';
import { NgModuleLoader } from './util/ng-module-loader';
import { PickerController } from './components/picker/picker-controller';
import { Platform, setupPlatform } from './platform/platform';
import { PlatformConfigToken, providePlatformConfigs } from './platform/platform-registry';
import { PopoverController } from './components/popover/popover-controller';
import { TapClick, setupTapClick } from './tap-click/tap-click';
import { ToastController } from './components/toast/toast-controller';
import { registerModeConfigs } from './config/mode-registry';
import { TransitionController } from './transitions/transition-controller';
import { UrlSerializer, setupUrlSerializer, DeepLinkConfigToken } from './navigation/url-serializer';

import { ActionSheetModule } from './components/action-sheet/action-sheet.module';
import { AlertModule } from './components/alert/alert.module';
import { AppModule } from './components/app/app.module';
import { AvatarModule } from './components/avatar/avatar.module';
import { BackdropModule } from './components/backdrop/backdrop.module';
import { BadgeModule } from './components/badge/badge.module';
import { ButtonModule } from './components/button/button.module';
import { CardModule } from './components/card/card.module';
import { CheckboxModule } from './components/checkbox/checkbox.module';
import { ChipModule } from './components/chip/chip.module';
import { ClickBlockModule } from './components/click-block/click-block.module';
import { ContentModule } from './components/content/content.module';
import { DateTimeModule } from './components/datetime/datetime.module';
import { FabModule } from './components/fab/fab.module';
import { GridModule } from './components/grid/grid.module';
import { IconModule } from './components/icon/icon.module';
import { ImgModule } from './components/img/img.module';
import { InfiniteScrollModule } from './components/infinite-scroll/infinite-scroll.module';
import { InputModule } from './components/input/input.module';
import { ItemModule } from './components/item/item.module';
import { LabelModule } from './components/label/label.module';
import { ListModule } from './components/list/list.module';
import { LoadingModule } from './components/loading/loading.module';
import { MenuModule } from './components/menu/menu.module';
import { ModalModule } from './components/modal/modal.module';
import { NavModule } from './components/nav/nav.module';
import { NavbarModule } from './components/navbar/navbar.module';
import { NoteModule } from './components/note/note.module';
import { OptionModule } from './components/option/option.module';
import { PickerModule } from './components/picker/picker.module';
import { PopoverModule } from './components/popover/popover.module';
import { RadioModule } from './components/radio/radio.module';
import { RangeModule } from './components/range/range.module';
import { RefresherModule } from './components/refresher/refresher.module';
import { ScrollModule } from './components/scroll/scroll.module';
import { SearchbarModule } from './components/searchbar/searchbar.module';
import { SegmentModule } from './components/segment/segment.module';
import { SelectModule } from './components/select/select.module';
import { ShowHideWhenModule } from './components/show-hide-when/show-hide-when.module';
import { SlidesModule } from './components/slides/slides.module';
import { SpinnerModule } from './components/spinner/spinner.module';
import { SplitPaneModule } from './components/split-pane/split-pane.module';
import { TabsModule } from './components/tabs/tabs.module';
import { ThumbnailModule } from './components/thumbnail/thumbnail.module';
import { ToastModule } from './components/toast/toast.module';
import { ToggleModule } from './components/toggle/toggle.module';
import { ToolbarModule } from './components/toolbar/toolbar.module';
import { TypographyModule } from './components/typography/typography.module';
import { VirtualScrollModule } from './components/virtual-scroll/virtual-scroll.module';

export { ActionSheetModule } from './components/action-sheet/action-sheet.module';
export { AlertModule } from './components/alert/alert.module';
export { AppModule } from './components/app/app.module';
export { AvatarModule } from './components/avatar/avatar.module';
export { BackdropModule } from './components/backdrop/backdrop.module';
export { BadgeModule } from './components/badge/badge.module';
export { ButtonModule } from './components/button/button.module';
export { CardModule } from './components/card/card.module';
export { CheckboxModule } from './components/checkbox/checkbox.module';
export { ChipModule } from './components/chip/chip.module';
export { ClickBlockModule } from './components/click-block/click-block.module';
export { ContentModule } from './components/content/content.module';
export { DateTimeModule } from './components/datetime/datetime.module';
export { FabModule } from './components/fab/fab.module';
export { GridModule } from './components/grid/grid.module';
export { IconModule } from './components/icon/icon.module';
export { ImgModule } from './components/img/img.module';
export { InfiniteScrollModule } from './components/infinite-scroll/infinite-scroll.module';
export { InputModule } from './components/input/input.module';
export { ItemModule } from './components/item/item.module';
export { LabelModule } from './components/label/label.module';
export { ListModule } from './components/list/list.module';
export { LoadingModule } from './components/loading/loading.module';
export { MenuModule } from './components/menu/menu.module';
export { ModalModule } from './components/modal/modal.module';
export { NavModule } from './components/nav/nav.module';
export { NavbarModule } from './components/navbar/navbar.module';
export { NoteModule } from './components/note/note.module';
export { OptionModule } from './components/option/option.module';
export { PickerModule } from './components/picker/picker.module';
export { PopoverModule } from './components/popover/popover.module';
export { RadioModule } from './components/radio/radio.module';
export { RangeModule } from './components/range/range.module';
export { RefresherModule } from './components/refresher/refresher.module';
export { ScrollModule } from './components/scroll/scroll.module';
export { SearchbarModule } from './components/searchbar/searchbar.module';
export { SegmentModule } from './components/segment/segment.module';
export { SelectModule } from './components/select/select.module';
export { ShowHideWhenModule } from './components/show-hide-when/show-hide-when.module';
export { SlidesModule } from './components/slides/slides.module';
export { SpinnerModule } from './components/spinner/spinner.module';
export { SplitPaneModule } from './components/split-pane/split-pane.module';
export { TabsModule } from './components/tabs/tabs.module';
export { ThumbnailModule } from './components/thumbnail/thumbnail.module';
export { ToastModule } from './components/toast/toast.module';
export { ToggleModule } from './components/toggle/toggle.module';
export { ToolbarModule } from './components/toolbar/toolbar.module';
export { TypographyModule } from './components/typography/typography.module';
export { VirtualScrollModule } from './components/virtual-scroll/virtual-scroll.module';

export { ActionSheet } from './components/action-sheet/action-sheet';
export { ActionSheetController } from './components/action-sheet/action-sheet-controller';
export { AlertController } from './components/alert/alert-controller';
export { Alert } from './components/alert/alert';
export { App } from './components/app/app';
export { Avatar } from './components/avatar/avatar';
export { Backdrop } from './components/backdrop/backdrop';
export { Badge } from './components/badge/badge';
export { Button } from './components/button/button';
export { Card } from './components/card/card';
export { CardContent } from './components/card/card-content';
export { CardHeader } from './components/card/card-header';
export { CardTitle } from './components/card/card-title';
export { Checkbox } from './components/checkbox/checkbox';
export { Chip } from './components/chip/chip';
export { ClickBlock } from './components/click-block/click-block';
export { Content } from './components/content/content';
export { DateTime } from './components/datetime/datetime';
export { FabButton } from './components/fab/fab';
export { FabContainer } from './components/fab/fab-container';
export { FabList } from './components/fab/fab-list';
export { Col } from './components/grid/col';
export { Grid } from './components/grid/grid';
export { Row } from './components/grid/row';
export { Ion } from './components/ion';
export { Icon } from './components/icon/icon';
export { Img } from './components/img/img';
export { InfiniteScroll } from './components/infinite-scroll/infinite-scroll';
export { InfiniteScrollContent } from './components/infinite-scroll/infinite-scroll-content';
export { TextInput } from './components/input/input';
export { IonicApp } from './components/app/app-root';
export { Item } from './components/item/item';
export { ItemContent } from './components/item/item-content';
export { ItemDivider } from './components/item/item-divider';
export { ItemGroup } from './components/item/item-group';
export { ItemReorder } from './components/item/item-reorder';
export { Reorder } from './components/item/reorder';
export { ItemSliding } from './components/item/item-sliding';
export { ItemOptions } from './components/item/item-options';
export { Label } from './components/label/label';
export { List } from './components/list/list';
export { ListHeader } from './components/list/list-header';
export { Loading } from './components/loading/loading';
export { LoadingController } from './components/loading/loading-controller';
export { Menu } from './components/menu/menu';
export { MenuClose } from './components/menu/menu-close';
export { MenuController } from './components/menu/menu-controller';
export { MenuToggle } from './components/menu/menu-toggle';
export { MenuType } from './components/menu/menu-types';
export { Modal } from './components/modal/modal';
export { ModalController } from './components/modal/modal-controller';
export { Nav } from './components/nav/nav';
export { NavPop } from './components/nav/nav-pop';
export { NavPopAnchor } from './components/nav/nav-pop-anchor';
export { NavPush } from './components/nav/nav-push';
export { NavPushAnchor } from './components/nav/nav-push-anchor';
export { Navbar } from './components/navbar/navbar';
export { NativeInput } from './components/input/native-input';
export { NextInput } from './components/input/next-input';
export { Note } from './components/note/note';
export { Option } from './components/option/option';
export { OverlayPortal } from './components/nav/overlay-portal';
export { Picker } from './components/picker/picker';
export { PickerController } from './components/picker/picker-controller';
export { Popover } from './components/popover/popover';
export { PopoverController } from './components/popover/popover-controller';
export { RadioButton } from './components/radio/radio-button';
export { RadioGroup } from './components/radio/radio-group';
export { Range } from './components/range/range';
export { RangeKnob } from './components/range/range-knob';
export { Refresher } from './components/refresher/refresher';
export { RefresherContent } from './components/refresher/refresher-content';
export { Scroll } from './components/scroll/scroll';
export { Searchbar } from './components/searchbar/searchbar';
export { Segment } from './components/segment/segment';
export { SegmentButton } from './components/segment/segment-button';
export { Select } from './components/select/select';
export { ShowWhen } from './components/show-hide-when/show-when';
export { DisplayWhen } from './components/show-hide-when/display-when';
export { HideWhen } from './components/show-hide-when/hide-when';
export { Slide } from './components/slides/slide';
export { Slides } from './components/slides/slides';
export { Spinner } from './components/spinner/spinner';
export { SplitPane, RootNode } from './components/split-pane/split-pane';
export { Tab } from './components/tabs/tab';
export { TabButton } from './components/tabs/tab-button';
export { TabHighlight } from './components/tabs/tab-highlight';
export { Tabs } from './components/tabs/tabs';
export { TapClick, setupTapClick, isActivatable } from './tap-click/tap-click';
export { Toast } from './components/toast/toast';
export { ToastController } from './components/toast/toast-controller';
export { Toggle } from './components/toggle/toggle';
export { ToolbarBase } from './components/toolbar/toolbar-base';
export { Toolbar } from './components/toolbar/toolbar';
export { Header } from './components/toolbar/toolbar-header';
export { Footer } from './components/toolbar/toolbar-footer';
export { ToolbarItem } from './components/toolbar/toolbar-item';
export { ToolbarTitle } from './components/toolbar/toolbar-title';
export { Thumbnail } from './components/thumbnail/thumbnail';
export { Typography } from './components/typography/typography';
export { VirtualScroll } from './components/virtual-scroll/virtual-scroll';

export { Config, setupConfig, ConfigToken } from './config/config';
export { DomController } from './platform/dom-controller';
export { Platform, setupPlatform } from './platform/platform';
export { Haptic } from './tap-click/haptic';
export { DeepLinker } from './navigation/deep-linker';
export { IonicPage } from './navigation/ionic-page';
export { NavController } from './navigation/nav-controller';
export { NavControllerBase } from './navigation/nav-controller-base';
export { NavParams } from './navigation/nav-params';
export { DeepLinkMetadata, DeepLinkMetadataFactory } from './navigation/nav-util';
export { UrlSerializer, DeepLinkConfigToken } from './navigation/url-serializer';
export { ViewController } from './navigation/view-controller';
export { ActionSheetCmp } from './components/action-sheet/action-sheet-component';
export { AlertCmp } from './components/alert/alert-component';
export { LoadingCmp } from './components/loading/loading-component';
export { ModalCmp } from './components/modal/modal-component';
export { PickerCmp } from './components/picker/picker-component';
export { PickerColumnCmp } from './components/picker/picker-column';
export { PopoverCmp } from './components/popover/popover-component';
export { ToastCmp } from './components/toast/toast-component';

export { PanGesture } from './gestures/drag-gesture';
export { Gesture } from './gestures/gesture';
export { SlideEdgeGesture } from './gestures/slide-edge-gesture';
export { SlideGesture } from './gestures/slide-gesture';
export { BLOCK_ALL, GESTURE_GO_BACK_SWIPE, GESTURE_MENU_SWIPE, GESTURE_ITEM_SWIPE, GESTURE_REFRESHER, GESTURE_TOGGLE, GestureController, GestureDelegate, BlockerDelegate, } from './gestures/gesture-controller';
export { Events, setupEvents, setupProvideEvents } from './util/events';
export { IonicErrorHandler } from './util/ionic-error-handler';
export { Keyboard } from './platform/keyboard';
export { Form, IonicFormInput, IonicTapInput } from './util/form';
export { reorderArray } from './util/util';
export { Animation } from './animations/animation';
export { PageTransition } from './transitions/page-transition';
export { Transition } from './transitions/transition';
export { PlatformConfigToken } from './platform/platform-registry';
export { registerModeConfigs } from './config/mode-registry';
export { IonicGestureConfig } from './gestures/gesture-config';

export class IonicModule {

    static forRoot(appRoot, config = null, deepLinkConfig = null) {
        return {
            ngModule: IonicModule,
            providers: [
                // useValue: bootstrap values
                { provide: AppRootToken, useValue: appRoot },
                { provide: ConfigToken, useValue: config },
                { provide: DeepLinkConfigToken, useValue: deepLinkConfig },
                { provide: APP_BASE_HREF, useValue: '/' },
                // useFactory: user values
                { provide: PlatformConfigToken, useFactory: providePlatformConfigs },
                // useFactory: ionic core providers
                { provide: Platform, useFactory: setupPlatform, deps: [DOCUMENT, PlatformConfigToken, NgZone] },
                { provide: Config, useFactory: setupConfig, deps: [ConfigToken, Platform] },
                // useFactory: ionic app initializers
                { provide: APP_INITIALIZER, useFactory: registerModeConfigs, deps: [Config], multi: true },
                { provide: APP_INITIALIZER, useFactory: setupProvideEvents, deps: [Platform, DomController], multi: true },
                { provide: APP_INITIALIZER, useFactory: setupTapClick, deps: [Config, Platform, DomController, App, NgZone, GestureController], multi: true },
                { provide: APP_INITIALIZER, useFactory: setupPreloading, deps: [Config, DeepLinkConfigToken, ModuleLoader, NgZone], multi: true },
                // useClass
                // { provide: HAMMER_GESTURE_CONFIG, useClass: IonicGestureConfig },
                // useValue
                { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: appRoot, multi: true },
                // ionic providers
                ActionSheetController,
                AlertController,
                App,
                DomController,
                Events,
                Form,
                GestureController,
                Haptic,
                Keyboard,
                LoadingController,
                Location,
                MenuController,
                ModalController,
                PickerController,
                PopoverController,
                NgModuleLoader,
                TapClick,
                ToastController,
                TransitionController,
                { provide: ModuleLoader, useFactory: provideModuleLoader, deps: [NgModuleLoader, Injector] },
                { provide: LocationStrategy, useFactory: provideLocationStrategy, deps: [PlatformLocation, [new Inject(APP_BASE_HREF), new Optional()], Config] },
                { provide: UrlSerializer, useFactory: setupUrlSerializer, deps: [DeepLinkConfigToken] },
                { provide: DeepLinker, useFactory: setupDeepLinker, deps: [App, UrlSerializer, Location, ModuleLoader, ComponentFactoryResolver] },
            ]
        };
    }
}
${ionicModuleDecorator}

IonicModule.ctorParameters = () => [];
function IonicModule_tsickle_Closure_declarations() {
    IonicModule.decorators;
    IonicModule.ctorParameters;
}

export class IonicPageModule {

    static forChild(page) {
        return {
            ngModule: IonicPageModule,
            providers: [
                { provide: (LAZY_LOADED_TOKEN), useValue: page },
                { provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: page, multi: true },
            ]
        };
    }
}
IonicPageModule.decorators = [
    { type: NgModule, args: [{
                imports: [IonicModule],
                exports: [IonicModule]
            },] },
];

IonicPageModule.ctorParameters = () => [];
function IonicPageModule_tsickle_Closure_declarations() {
    IonicPageModule.decorators;
    IonicPageModule.ctorParameters;
}

export function provideLocationStrategy(platformLocationStrategy, baseHref, config) {
    return config.get('locationStrategy') === 'path' ?
        new PathLocationStrategy(platformLocationStrategy, baseHref) :
        new HashLocationStrategy(platformLocationStrategy, baseHref);
}
//# sourceMappingURL=index.js.map
`;
      let magicString = new MagicString(knownContent);
      const entryPoint = join(ionicAngular, 'index.js');
      magicString = decorators.purgeStaticFieldDecorators(entryPoint, knownContent, ionicAngular, angularDir, srcDir, magicString);
      const result = magicString.toString();
      expect(result.indexOf(ionicModuleDecorator)).toEqual(-1);
    });

    it('shoud process component file correctly', () => {

        const propDecorators = `
ActionSheetCmp.propDecorators = {
    'keyUp': [{ type: HostListener, args: ['body:keyup', ['$event'],] },],
};
`;
        const decoratorContent = `
ActionSheetCmp.decorators = [
    { type: Component, args: [{
                selector: 'ion-action-sheet',
                template: '<ion-backdrop (click)="bdClick()" [class.backdrop-no-tappable]="!d.enableBackdropDismiss"></ion-backdrop>' +
                    '<div class="action-sheet-wrapper">' +
                    '<div class="action-sheet-container">' +
                    '<div class="action-sheet-group">' +
                    '<div class="action-sheet-title" id="{{hdrId}}" *ngIf="d.title">{{d.title}}</div>' +
                    '<div class="action-sheet-sub-title" id="{{descId}}" *ngIf="d.subTitle">{{d.subTitle}}</div>' +
                    '<button ion-button="action-sheet-button" (click)="click(b)" *ngFor="let b of d.buttons" class="disable-hover" [attr.icon-left]="b.icon ? \'\' : null" [ngClass]="b.cssClass">' +
                    '<ion-icon [name]="b.icon" *ngIf="b.icon" class="action-sheet-icon"></ion-icon>' +
                    '{{b.text}}' +
                    '</button>' +
                    '</div>' +
                    '<div class="action-sheet-group" *ngIf="d.cancelButton">' +
                    '<button ion-button="action-sheet-button" (click)="click(d.cancelButton)" class="action-sheet-cancel disable-hover" [attr.icon-left]="d.cancelButton.icon ? \'\' : null" [ngClass]="d.cancelButton.cssClass">' +
                    '<ion-icon [name]="d.cancelButton.icon" *ngIf="d.cancelButton.icon" class="action-sheet-icon"></ion-icon>' +
                    '{{d.cancelButton.text}}' +
                    '</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>',
                host: {
                    'role': 'dialog',
                    '[attr.aria-labelledby]': 'hdrId',
                    '[attr.aria-describedby]': 'descId'
                },
                encapsulation: ViewEncapsulation.None,
            },] },
];
        `;
        const knownContent = `
import { Component, ElementRef, HostListener, Renderer, ViewEncapsulation } from '@angular/core';
import { GestureController, BLOCK_ALL } from '../../gestures/gesture-controller';
import { Config } from '../../config/config';
import { KEY_ESCAPE } from '../../platform/key';
import { Platform } from '../../platform/platform';
import { NavParams } from '../../navigation/nav-params';
import { ViewController } from '../../navigation/view-controller';

export class ActionSheetCmp {

    constructor(_viewCtrl, config, _plt, _elementRef, gestureCtrl, params, renderer) {
        this._viewCtrl = _viewCtrl;
        this._plt = _plt;
        this._elementRef = _elementRef;
        this.gestureBlocker = gestureCtrl.createBlocker(BLOCK_ALL);
        this.d = params.data;
        this.mode = config.get('mode');
        renderer.setElementClass(_elementRef.nativeElement, \`action-sheet-${this.mode}\`, true);
        if (this.d.cssClass) {
            this.d.cssClass.split(' ').forEach(cssClass => {
                // Make sure the class isn't whitespace, otherwise it throws exceptions
                if (cssClass.trim() !== '')
                    renderer.setElementClass(_elementRef.nativeElement, cssClass, true);
            });
        }
        this.id = (++actionSheetIds);
        if (this.d.title) {
            this.hdrId = 'acst-hdr-' + this.id;
        }
        if (this.d.subTitle) {
            this.descId = 'acst-subhdr-' + this.id;
        }
    }

    ionViewDidLoad() {
        // normalize the data
        let  buttons = [];
        this.d.buttons.forEach((button) => {
            if (typeof button === 'string') {
                button = { text: button };
            }
            if (!button.cssClass) {
                button.cssClass = '';
            }
            if (button.role === 'cancel') {
                this.d.cancelButton = button;
            }
            else {
                if (button.role === 'destructive') {
                    button.cssClass = (button.cssClass + ' ' || '') + 'action-sheet-destructive';
                }
                else if (button.role === 'selected') {
                    button.cssClass = (button.cssClass + ' ' || '') + 'action-sheet-selected';
                }
                buttons.push(button);
            }
        });
        this.d.buttons = buttons;
    }

    ionViewWillEnter() {
        this.gestureBlocker.block();
    }

    ionViewDidLeave() {
        this.gestureBlocker.unblock();
    }

    ionViewDidEnter() {
        this._plt.focusOutActiveElement();
        const  focusableEle = this._elementRef.nativeElement.querySelector('button');
        if (focusableEle) {
            focusableEle.focus();
        }
        this.enabled = true;
    }

    keyUp(ev) {
        if (this.enabled && ev.keyCode === KEY_ESCAPE && this._viewCtrl.isLast()) {
            (void 0) ;
            this.bdClick();
        }
    }

    click(button) {
        if (!this.enabled) {
            return;
        }
        let shouldDismiss = true;
        if (button.handler) {
            // a handler has been provided, execute it
            if (button.handler() === false) {
                // if the return value of the handler is false then do not dismiss
                shouldDismiss = false;
            }
        }
        if (shouldDismiss) {
            this.dismiss(button.role);
        }
    }

    bdClick() {
        if (this.enabled && this.d.enableBackdropDismiss) {
            if (this.d.cancelButton) {
                this.click(this.d.cancelButton);
            }
            else {
                this.dismiss('backdrop');
            }
        }
    }

    dismiss(role) {
        const  opts = {
            minClickBlockDuration: 400
        };
        return this._viewCtrl.dismiss(null, role, opts);
    }

    ngOnDestroy() {
        (void 0);
        this.d = null;
        this.gestureBlocker.destroy();
    }
}
${decoratorContent}

ActionSheetCmp.ctorParameters = () => [
    { type: ViewController, },
    { type: Config, },
    { type: Platform, },
    { type: ElementRef, },
    { type: GestureController, },
    { type: NavParams, },
    { type: Renderer, },
];
${propDecorators}
function ActionSheetCmp_tsickle_Closure_declarations() {

    ActionSheetCmp.decorators;

    ActionSheetCmp.ctorParameters;

    ActionSheetCmp.propDecorators;

    ActionSheetCmp.prototype.d;

    ActionSheetCmp.prototype.descId;

    ActionSheetCmp.prototype.enabled;

    ActionSheetCmp.prototype.hdrId;

    ActionSheetCmp.prototype.id;

    ActionSheetCmp.prototype.mode;

    ActionSheetCmp.prototype.gestureBlocker;

    ActionSheetCmp.prototype._viewCtrl;

    ActionSheetCmp.prototype._plt;

    ActionSheetCmp.prototype._elementRef;
}
let actionSheetIds = -1;
//# sourceMappingURL=action-sheet-component.js.map
`;

      let magicString = new MagicString(knownContent);
      const filePath = join(ionicAngular, 'components', 'action-sheet', 'action-sheet-component.js');
      magicString = decorators.purgeStaticFieldDecorators(filePath, knownContent, ionicAngular, angularDir, srcDir, magicString);
      const result = magicString.toString();
      expect(result.indexOf(decoratorContent)).toEqual(-1);
      expect(result.indexOf(propDecorators)).toEqual(-1);
    });
  });
});
