import {
  AfterViewInit,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { NgxGalleryHelperService } from './ngx-gallery-helper.service';
import { NgxGalleryImageComponent } from './ngx-gallery-image.component';
import { NgxGalleryImage } from './ngx-gallery-image.model';
import { NgxGalleryLayout } from './ngx-gallery-layout.model';
import { NgxGalleryOptions } from './ngx-gallery-options.model';
import { NgxGalleryOrderedImage } from './ngx-gallery-ordered-image.model';
import { NgxGalleryPreviewComponent } from './ngx-gallery-preview.component';
import { NgxGalleryThumbnailsComponent } from './ngx-gallery-thumbnails.component';

@Component({
  selector: 'ngx-gallery',
  template: `
    <div class="ngx-gallery-layout {{ currentOptions?.layout }}">
      <ngx-gallery-image
        *ngIf="currentOptions?.image"
        [style.height]="getImageHeight()"
        [images]="mediumImages"
        [clickable]="currentOptions?.preview"
        [selectedIndex]="selectedIndex"
        [arrows]="currentOptions?.imageArrows"
        [arrowsAutoHide]="currentOptions?.imageArrowsAutoHide"
        [arrowPrevIcon]="currentOptions?.arrowPrevIcon"
        [arrowNextIcon]="currentOptions?.arrowNextIcon"
        [swipe]="currentOptions?.imageSwipe"
        [animation]="currentOptions?.imageAnimation"
        [size]="currentOptions?.imageSize"
        [autoPlay]="currentOptions?.imageAutoPlay"
        [autoPlayInterval]="currentOptions?.imageAutoPlayInterval"
        [autoPlayPauseOnHover]="currentOptions?.imageAutoPlayPauseOnHover"
        [infinityMove]="currentOptions?.imageInfinityMove"
        [lazyLoading]="currentOptions?.lazyLoading"
        [actions]="currentOptions?.imageActions"
        [descriptions]="descriptions"
        [showDescription]="currentOptions?.imageDescription"
        [bullets]="currentOptions?.imageBullets"
        (clicked)="openPreview($event)"
        (activeChange)="selectFromImage($event)"
      ></ngx-gallery-image>

      <ngx-gallery-thumbnails
        *ngIf="currentOptions?.thumbnails"
        [style.marginTop]="getThumbnailsMarginTop()"
        [style.marginBottom]="getThumbnailsMarginBottom()"
        [style.height]="getThumbnailsHeight()"
        [images]="smallImages"
        [links]="currentOptions?.thumbnailsAsLinks ? links : []"
        [labels]="labels"
        [linkTarget]="currentOptions?.linkTarget"
        [selectedIndex]="selectedIndex"
        [columns]="currentOptions?.thumbnailsColumns"
        [rows]="currentOptions?.thumbnailsRows"
        [margin]="currentOptions?.thumbnailMargin"
        [arrows]="currentOptions?.thumbnailsArrows"
        [arrowsAutoHide]="currentOptions?.thumbnailsArrowsAutoHide"
        [arrowPrevIcon]="currentOptions?.arrowPrevIcon"
        [arrowNextIcon]="currentOptions?.arrowNextIcon"
        [clickable]="currentOptions?.image || currentOptions?.preview"
        [swipe]="currentOptions?.thumbnailsSwipe"
        [size]="currentOptions?.thumbnailSize"
        [moveSize]="currentOptions?.thumbnailsMoveSize"
        [order]="currentOptions?.thumbnailsOrder"
        [remainingCount]="currentOptions?.thumbnailsRemainingCount"
        [lazyLoading]="currentOptions?.lazyLoading"
        [actions]="currentOptions?.thumbnailActions"
        (activeChange)="selectFromThumbnails($event)"
      ></ngx-gallery-thumbnails>

      <ngx-gallery-preview
        [images]="bigImages"
        [descriptions]="descriptions"
        [showDescription]="currentOptions?.previewDescription"
        [arrowPrevIcon]="currentOptions?.arrowPrevIcon"
        [arrowNextIcon]="currentOptions?.arrowNextIcon"
        [closeIcon]="currentOptions?.closeIcon"
        [fullscreenIcon]="currentOptions?.fullscreenIcon"
        [spinnerIcon]="currentOptions?.spinnerIcon"
        [arrows]="currentOptions?.previewArrows"
        [arrowsAutoHide]="currentOptions?.previewArrowsAutoHide"
        [swipe]="currentOptions?.previewSwipe"
        [fullscreen]="currentOptions?.previewFullscreen"
        [forceFullscreen]="currentOptions?.previewForceFullscreen"
        [closeOnClick]="currentOptions?.previewCloseOnClick"
        [closeOnEsc]="currentOptions?.previewCloseOnEsc"
        [keyboardNavigation]="currentOptions?.previewKeyboardNavigation"
        [animation]="currentOptions?.previewAnimation"
        [autoPlay]="currentOptions?.previewAutoPlay"
        [autoPlayInterval]="currentOptions?.previewAutoPlayInterval"
        [autoPlayPauseOnHover]="currentOptions?.previewAutoPlayPauseOnHover"
        [infinityMove]="currentOptions?.previewInfinityMove"
        [zoom]="currentOptions?.previewZoom"
        [zoomStep]="currentOptions?.previewZoomStep"
        [zoomMax]="currentOptions?.previewZoomMax"
        [zoomMin]="currentOptions?.previewZoomMin"
        [zoomInIcon]="currentOptions?.zoomInIcon"
        [zoomOutIcon]="currentOptions?.zoomOutIcon"
        [actions]="currentOptions?.actions"
        [rotate]="currentOptions?.previewRotate"
        [rotateLeftIcon]="currentOptions?.rotateLeftIcon"
        [rotateRightIcon]="currentOptions?.rotateRightIcon"
        [download]="currentOptions?.previewDownload"
        [downloadIcon]="currentOptions?.downloadIcon"
        [bullets]="currentOptions?.previewBullets"
        (closed)="onPreviewClose()"
        (opened)="onPreviewOpen()"
        (activeChange)="previewSelect($event)"
        [class.ngx-gallery-active]="previewEnabled"
      ></ngx-gallery-preview>
    </div>
  `,
  styleUrls: ['./ngx-gallery.component.scss'],
  providers: [NgxGalleryHelperService]
})
export class NgxGalleryComponent implements OnInit, DoCheck, AfterViewInit {
  @Input() options: NgxGalleryOptions[];
  @Input() images: NgxGalleryImage[];

  @Output() imagesReady = new EventEmitter();
  // tslint:disable-next-line: no-output-native
  @Output() change = new EventEmitter<{
    index: number;
    image: NgxGalleryImage;
  }>();
  @Output() previewOpen = new EventEmitter();
  @Output() previewClose = new EventEmitter();
  @Output() previewChange = new EventEmitter<{
    index: number;
    image: NgxGalleryImage;
  }>();

  smallImages: string[] | SafeResourceUrl[];
  mediumImages: NgxGalleryOrderedImage[];
  bigImages: string[] | SafeResourceUrl[];
  descriptions: string[];
  links: string[];
  labels: string[];

  oldImages: NgxGalleryImage[];
  oldImagesLength = 0;

  selectedIndex = 0;
  previewEnabled: boolean;

  currentOptions: NgxGalleryOptions;

  private breakpoint: number | undefined = undefined;
  private prevBreakpoint: number | undefined = undefined;
  private fullWidthTimeout: any;

  @ViewChild(NgxGalleryPreviewComponent)
  preview: NgxGalleryPreviewComponent;
  @ViewChild(NgxGalleryImageComponent)
  image: NgxGalleryImageComponent;
  @ViewChild(NgxGalleryThumbnailsComponent)
  thubmnails: NgxGalleryThumbnailsComponent;

  @HostBinding('style.width') width: string;
  @HostBinding('style.height') height: string;
  @HostBinding('style.left') left: string;

  constructor(private myElement: ElementRef) {}

  ngOnInit() {
    this.options = this.options.map(opt => new NgxGalleryOptions(opt));
    this.sortOptions();
    this.setBreakpoint();
    this.setOptions();
    this.checkFullWidth();
    if (this.currentOptions) {
      this.selectedIndex = this.currentOptions.startIndex as number;
    }
  }

  ngDoCheck(): void {
    if ((this.images !== undefined && this.images.length !== this.oldImagesLength) || this.images !== this.oldImages) {
      this.oldImagesLength = this.images.length;
      this.oldImages = this.images;
      this.setOptions();
      this.setImages();

      if (this.images && this.images.length) {
        this.imagesReady.emit();
      }

      if (this.image) {
        this.image.reset(this.currentOptions.startIndex as number);
      }

      if (this.currentOptions.thumbnailsAutoHide && this.currentOptions.thumbnails && this.images.length <= 1) {
        this.currentOptions.thumbnails = false;
        this.currentOptions.imageArrows = false;
      }

      this.resetThumbnails();
    }
  }

  ngAfterViewInit(): void {
    this.checkFullWidth();
  }

  @HostListener('window:resize') onResize() {
    this.setBreakpoint();

    if (this.prevBreakpoint !== this.breakpoint) {
      this.setOptions();
      this.resetThumbnails();
    }

    if (this.currentOptions && this.currentOptions.fullWidth) {
      if (this.fullWidthTimeout) {
        clearTimeout(this.fullWidthTimeout);
      }

      this.fullWidthTimeout = setTimeout(() => {
        this.checkFullWidth();
      }, 200);
    }
  }

  getImageHeight(): string {
    return this.currentOptions && this.currentOptions.thumbnails ? this.currentOptions.imagePercent + '%' : '100%';
  }

  getThumbnailsHeight(): string {
    if (this.currentOptions && this.currentOptions.image) {
      return 'calc(' + this.currentOptions.thumbnailsPercent + '% - ' + this.currentOptions.thumbnailsMargin + 'px)';
    } else {
      return '100%';
    }
  }

  getThumbnailsMarginTop(): string {
    if (this.currentOptions && this.currentOptions.layout === NgxGalleryLayout.ThumbnailsBottom) {
      return this.currentOptions.thumbnailsMargin + 'px';
    } else {
      return '0px';
    }
  }

  getThumbnailsMarginBottom(): string {
    if (this.currentOptions && this.currentOptions.layout === NgxGalleryLayout.ThumbnailsTop) {
      return this.currentOptions.thumbnailsMargin + 'px';
    } else {
      return '0px';
    }
  }

  openPreview(index: number): void {
    if (this.currentOptions.previewCustom) {
      this.currentOptions.previewCustom(index);
    } else {
      this.previewEnabled = true;
      this.preview.open(index);
    }
  }

  onPreviewOpen(): void {
    this.previewOpen.emit();

    if (this.image && this.image.autoPlay) {
      this.image.stopAutoPlay();
    }
  }

  onPreviewClose(): void {
    this.previewEnabled = false;
    this.previewClose.emit();

    if (this.image && this.image.autoPlay) {
      this.image.startAutoPlay();
    }
  }

  selectFromImage(index: number) {
    this.select(index);
  }

  selectFromThumbnails(index: number) {
    this.select(index);

    if (
      this.currentOptions &&
      this.currentOptions.thumbnails &&
      this.currentOptions.preview &&
      (!this.currentOptions.image || this.currentOptions.thumbnailsRemainingCount)
    ) {
      this.openPreview(this.selectedIndex);
    }
  }

  show(index: number): void {
    this.select(index);
  }

  showNext(): void {
    this.image.showNext();
  }

  showPrev(): void {
    this.image.showPrev();
  }

  canShowNext(): boolean {
    if (this.images && this.currentOptions) {
      return this.currentOptions.imageInfinityMove || this.selectedIndex < this.images.length - 1 ? true : false;
    } else {
      return false;
    }
  }

  canShowPrev(): boolean {
    if (this.images && this.currentOptions) {
      return this.currentOptions.imageInfinityMove || this.selectedIndex > 0 ? true : false;
    } else {
      return false;
    }
  }

  previewSelect(index: number) {
    this.previewChange.emit({ index, image: this.images[index] });
  }

  moveThumbnailsRight() {
    this.thubmnails.moveRight();
  }

  moveThumbnailsLeft() {
    this.thubmnails.moveLeft();
  }

  canMoveThumbnailsRight() {
    return this.thubmnails.canMoveRight();
  }

  canMoveThumbnailsLeft() {
    return this.thubmnails.canMoveLeft();
  }

  private resetThumbnails() {
    if (this.thubmnails) {
      this.thubmnails.reset(this.currentOptions.startIndex as number);
    }
  }

  private select(index: number) {
    this.selectedIndex = index;

    this.change.emit({
      index,
      image: this.images[index]
    });
  }

  private checkFullWidth(): void {
    if (this.currentOptions && this.currentOptions.fullWidth) {
      this.width = document.body.clientWidth + 'px';
      this.left = -(document.body.clientWidth - this.myElement.nativeElement.parentNode.innerWidth) / 2 + 'px';
    }
  }

  private setImages(): void {
    this.smallImages = this.images.map(img => img.small as string);
    this.mediumImages = this.images.map(
      (img, i) =>
        new NgxGalleryOrderedImage({
          src: img.medium,
          index: i
        })
    );
    this.bigImages = this.images.map(img => img.big as string);
    this.descriptions = this.images.map(img => img.description as string);
    this.links = this.images.map(img => img.url as string);
    this.labels = this.images.map(img => img.label as string);
  }

  private setBreakpoint(): void {
    this.prevBreakpoint = this.breakpoint;
    let breakpoints;

    if (typeof window !== 'undefined') {
      breakpoints = this.options.filter(opt => opt.breakpoint >= window.innerWidth).map(opt => opt.breakpoint);
    }

    if (breakpoints && breakpoints.length) {
      this.breakpoint = breakpoints.pop();
    } else {
      this.breakpoint = undefined;
    }
  }

  private sortOptions(): void {
    this.options = [
      ...this.options.filter(a => a.breakpoint === undefined),
      ...this.options.filter(a => a.breakpoint !== undefined).sort((a, b) => b.breakpoint - a.breakpoint)
    ];
  }

  private setOptions(): void {
    this.currentOptions = new NgxGalleryOptions({});

    this.options
      .filter(opt => opt.breakpoint === undefined || opt.breakpoint >= this.breakpoint)
      .map(opt => this.combineOptions(this.currentOptions, opt));

    this.width = this.currentOptions.width as string;
    this.height = this.currentOptions.height as string;
  }

  private combineOptions(first: NgxGalleryOptions, second: NgxGalleryOptions) {
    Object.keys(second).map(val => (first[val] = second[val] !== undefined ? second[val] : first[val]));
  }
}
