import {Component, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, EventEmitter} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Observable, Subject, Subscription, combineLatest, merge} from 'rxjs';
import {FieldConfig, FieldConfigOption, FieldConfigOptionsBuilder} from '../common-form-config';
import {tap} from 'rxjs/operators';
import * as _ from 'lodash-es';
import {ValueComparator} from '../utilities/value-comparator';
@Component({
  selector: 'sb-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.css']
})
export class DropdownComponent implements OnInit, OnChanges, OnDestroy {
  ValueComparator = ValueComparator;
  @Input() field: FieldConfig<String>;
  @Input() disabled?: boolean;
  @Input() options: any;
  @Input() label?: string;
  @Input() placeHolder?: string;
  @Input() isMultiple?: boolean;
  @Input() context?: FormControl;
  @Input() contextTerms?: any;
  @Input() formControlRef?: FormControl;
  @Input() formGroup?: FormGroup;
  @Input() default?: any;
  @Input() contextData: any;
  @Input() dataLoadStatusDelegate: Subject<'LOADING' | 'LOADED'>;
  @Input() type?: string;
  @Input() styleClass?: string;
  @Output() onChangeFilter: EventEmitter<any> = new EventEmitter();

  @Input() depends?: FormControl[];
  @Input() dependencyTerms?: any = [];

  options$?: Observable<FieldConfigOption<any>[]>;
  contextValueChangesSubscription?: Subscription;
  selectedType: any;
  tempAssociation: any;
  latestParentValue: string;
  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.options) {
      this.options = [];
    }
    if (this.isOptionsClosure(this.options)) {
      this.options$ = (this.options as FieldConfigOptionsBuilder<any>)(
        this.formControlRef,
        this.context,
        () => this.dataLoadStatusDelegate.next('LOADING'),
        () => this.dataLoadStatusDelegate.next('LOADED')
      ) as any;
    }
  }

  ngOnInit() {
    // if (this.context) {
      // this.contextValueChangesSubscription = this.context.valueChanges.pipe(
      //   tap(() => {
      //     this.formControlRef.patchValue(null);
      //   })
      // ).subscribe();
    // }

    if (!_.isEmpty(this.field.depends)) {
      this.formControlRef.valueChanges.pipe(
          tap(() => {
            _.forEach(this.field.depends, depend => {
              if (!_.isEmpty(this.formGroup.get(depend))) {
                this.formGroup.get(depend).patchValue(null);
              }
            });
          })
      ).subscribe();
    }
    if (!_.isEmpty(this.depends)) {
     this.contextValueChangesSubscription =  merge(..._.map(this.depends, depend => depend.valueChanges)).pipe(
      tap((value: any) => {
        this.latestParentValue = value;
      })
      ).subscribe();
    }
    if (this.field && this.field.range) {
      this.options = this.field.range;
    }
  }

  ngOnDestroy(): void {
    // this.contextValueChangesSubscription.unsubscribe();
  }

  isOptionsArray(options: any) {
    return Array.isArray(options);

  }

  isOptionsClosure(options: any) {
    return typeof options === 'function';
  }

  isOptionsMap(input: any) {
    return !Array.isArray(input) && typeof input === 'object';
  }

  isOptionsArrayMap(input: any) {
    return Array.isArray(input) && typeof input[0] === 'object';
  }

  onChangeFacet($event) {
    const selectedObject = this.options.data[$event.currentTarget.options.selectedIndex - 1];
    const emitPayload = JSON.parse(JSON.stringify(this.options));
    emitPayload['data'] = selectedObject;
    emitPayload['selectedLabel'] = selectedObject.label;
    emitPayload['selectedValue'] = selectedObject.value;
    this.onChangeFilter.emit(emitPayload);
  }

  fetchAssociations() {
    // && this.context.value && this.field.association
    if (!_.isEmpty(this.depends)) {
      const filteredTerm = _.find(this.dependencyTerms, terms => {
        return _.includes(this.getParentValue(), terms.identifier);
      });
      if (filteredTerm) {
        this.tempAssociation =  _.filter(filteredTerm.associations, association => {
          return association.category === this.field.code;
        });
        return this.tempAssociation;
      } else  {
        return this.options;
      }
    } else {
      return this.options;
    }
  }


  getParentValue() {
    return this.latestParentValue || _.compact(_.map(this.depends, 'value'));
  }
}
