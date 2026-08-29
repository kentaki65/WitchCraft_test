type Task = [() => void, string, number];

interface Scheduler {
  tasks: Record<number, Task[]>;
  tags: Record<string, number>;
  current: number;
  opCounter: number;
  activeIndex: number;
  execute: () => void;
  run: (task: () => void, delay?: number, tag?: string) => void;
  stop: (tag: string) => void;
}

export const S: Scheduler = {
  tasks: {},
  tags: {},
  current: 0,
  opCounter: 0,
  activeIndex: 0,
  execute(): void {
    let tasks = S.tasks[S.current];
    do {
      const [fn, tag, taskId]: Task = tasks[S.activeIndex];
      let canceledAt = S.tags[tag];

      if (!(taskId < canceledAt)) {
        try{
          fn();
        }catch(e: any){
          api.log(`error in scheduler tag: ${tag}\nmessage: ${e.message}`);
        }
      }
    } while (++S.activeIndex < tasks.length);
  },
  run(task: () => void, delay: number, tag = "_def_"): void {
    let tick = S.current + delay;
    if (!S.tasks[tick]) {
        S.tasks[tick] = [];
    }
    
    let tasks: Task[] = S.tasks[tick];
    tasks.push([task, tag, S.opCounter++]); //[fn, tag, counter]の順番で
  },
  stop(tag: string): void {
    S.tags[tag] = S.opCounter++
  }
};

function handleTick(){
  const hasFunc = S.tasks[S.current];
  if (hasFunc !== undefined) {
    S.execute();
  }
  delete S.tasks[S.current++]; //今実行したタスクを削除
  S.activeIndex = 0;
};

export const handlers = {
  tick: handleTick,
}