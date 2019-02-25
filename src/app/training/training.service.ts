import { Exercise } from './exercise.model';
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

@Injectable()
export class TrainingService {
    exerciseChange = new Subject<Exercise>();
    exercisesChange = new Subject<Exercise[]>();
    private avaliableExercises: Exercise[] = [];
    private runningExercise: Exercise;
    private exercises: Exercise[] = [];


    constructor(private db: AngularFirestore) { }

    fetchAvailableExercises() {
        this.db
            .collection('avaliableExercises')
            .snapshotChanges()
            .pipe(map(docArray => {
                return docArray.map(doc => {
                    return {
                        id: doc.payload.doc.id,
                        // name: doc.payload.doc.data().name,
                        // duration: doc.payload.doc.data().duration,
                        // calories: doc.payload.doc.data().calories
                        ...doc.payload.doc.data()
                    };
                });
            }))
            .subscribe((exercises: Exercise[]) => {
                this.avaliableExercises = exercises;
                this.exercisesChange.next([ ...this.avaliableExercises ]);
            });
    }

    startExercise(selectedId: string) {
        this.runningExercise = this.avaliableExercises.find(ex => ex.id === selectedId);
        this.exerciseChange.next({ ...this.runningExercise });
    }

    completeExercise() {
        this.exercises.push({ ...this.runningExercise, date: new Date(), state: 'completed' });
        this.runningExercise = null;
        this.exerciseChange.next(null);
    }

    cancelExercise(progress: number) {
        this.exercises.push({
            ...this.runningExercise,
            duration: this.runningExercise.duration * (progress / 100),
            calories: this.runningExercise.calories * (progress / 100),
            date: new Date(),
            state: 'cancelled'
        });
        this.runningExercise = null;
        this.exerciseChange.next(null);
    }

    getRunningExercise() {
        return { ...this.runningExercise };
    }

    getCompletedOrCancelledExercises() {
        return this.exercises.slice();
    }
}
