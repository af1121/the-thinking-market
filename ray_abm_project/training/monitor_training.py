#!/usr/bin/env python3

import time
import os
import subprocess
import re
from datetime import datetime

def monitor_training():
    """Monitor the long training session progress"""
    
    print("🔍 Multi-Agent Training Monitor")
    print("=" * 50)
    
    log_file = "long_training.log"
    
    if not os.path.exists(log_file):
        print("❌ Training log file not found. Is training running?")
        return
    
    print(f"📊 Monitoring training progress from {log_file}")
    print("🔄 Press Ctrl+C to stop monitoring\n")
    
    last_size = 0
    iteration_count = 0
    start_time = None
    
    try:
        while True:
            # Check if training process is still running
            try:
                result = subprocess.run(['pgrep', '-f', 'long_multi_agent_train.py'], 
                                      capture_output=True, text=True)
                if not result.stdout.strip():
                    print("🏁 Training process has completed!")
                    break
            except:
                pass
            
            # Check log file size
            current_size = os.path.getsize(log_file)
            
            if current_size > last_size:
                # Read new content
                with open(log_file, 'r') as f:
                    f.seek(last_size)
                    new_content = f.read()
                    
                    # Look for iteration progress
                    iteration_matches = re.findall(r'🔄 Training iteration (\d+)/(\d+)', new_content)
                    if iteration_matches:
                        current_iter, total_iter = iteration_matches[-1]
                        iteration_count = int(current_iter)
                        total_iterations = int(total_iter)
                        
                        if start_time is None:
                            start_time = datetime.now()
                        
                        elapsed = datetime.now() - start_time
                        progress = (iteration_count / total_iterations) * 100
                        
                        print(f"📈 Iteration {current_iter}/{total_iter} ({progress:.1f}%) - "
                              f"Elapsed: {elapsed}")
                    
                    # Look for reward updates
                    reward_matches = re.findall(r'🏆 New best reward: ([\d\.-]+)', new_content)
                    if reward_matches:
                        best_reward = reward_matches[-1]
                        print(f"🏆 New best reward: {best_reward}")
                    
                    # Look for test results
                    test_matches = re.findall(r'📈 Average test reward: ([\d\.-]+)', new_content)
                    if test_matches:
                        test_reward = test_matches[-1]
                        print(f"🧪 Test reward: {test_reward}")
                    
                    # Look for completion
                    if "🏁 Long training completed!" in new_content:
                        print("🎉 Training completed successfully!")
                        break
                
                last_size = current_size
            
            time.sleep(5)  # Check every 5 seconds
            
    except KeyboardInterrupt:
        print("\n⏹️ Monitoring stopped by user")
    
    # Show final status
    print("\n📊 Final Status:")
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            content = f.read()
            
            # Find final iteration
            final_iter_matches = re.findall(r'🔄 Training iteration (\d+)/(\d+)', content)
            if final_iter_matches:
                final_iter, total_iter = final_iter_matches[-1]
                print(f"   Last iteration: {final_iter}/{total_iter}")
            
            # Find best reward
            reward_matches = re.findall(r'🏆 New best reward: ([\d\.-]+)', content)
            if reward_matches:
                best_reward = reward_matches[-1]
                print(f"   Best reward: {best_reward}")
            
            # Check for completion
            if "🏁 Long training completed!" in content:
                print("   Status: ✅ COMPLETED")
                
                # Look for result files
                result_files = [f for f in os.listdir('.') if 'long_multi_agent' in f and 
                              (f.endswith('.png') or f.endswith('.json'))]
                if result_files:
                    print(f"   Result files: {', '.join(result_files)}")
            else:
                print("   Status: 🔄 RUNNING or ❌ STOPPED")

def show_training_status():
    """Show current training status"""
    
    print("📊 Training Status Check")
    print("=" * 30)
    
    # Check if process is running
    try:
        result = subprocess.run(['pgrep', '-f', 'long_multi_agent_train.py'], 
                              capture_output=True, text=True)
        if result.stdout.strip():
            pid = result.stdout.strip()
            print(f"✅ Training is RUNNING (PID: {pid})")
            
            # Get process info
            try:
                ps_result = subprocess.run(['ps', '-p', pid, '-o', 'pid,pcpu,pmem,etime'], 
                                         capture_output=True, text=True)
                print(f"📈 Process info:\n{ps_result.stdout}")
            except:
                pass
        else:
            print("❌ Training is NOT RUNNING")
    except:
        print("❓ Could not check process status")
    
    # Check log file
    log_file = "long_training.log"
    if os.path.exists(log_file):
        size_mb = os.path.getsize(log_file) / (1024 * 1024)
        mod_time = datetime.fromtimestamp(os.path.getmtime(log_file))
        print(f"📄 Log file: {log_file} ({size_mb:.1f} MB)")
        print(f"📅 Last modified: {mod_time}")
        
        # Show last few lines
        try:
            result = subprocess.run(['tail', '-5', log_file], capture_output=True, text=True)
            print(f"📝 Last 5 lines:\n{result.stdout}")
        except:
            pass
    else:
        print("❌ No log file found")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "status":
        show_training_status()
    else:
        monitor_training() 